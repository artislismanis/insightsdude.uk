#!/usr/bin/env node

/**
 * S3 + Amplify Static Site Deployment
 *
 * Syncs local build to S3 (in a branch-named folder) and triggers Amplify Hosting deployment.
 * Only deploys from the main git branch by default (stage-gate).
 *
 * Usage:
 *   node deploy.mjs [options]
 *
 * Options:
 *   --dry-run        Show what would happen without making changes
 *   --force          Bypass git branch check
 *   --skip-amplify   Sync to S3 only, don't trigger Amplify deployment
 *   --force-amplify  Trigger Amplify even if no S3 changes detected
 *   --verbose        Show detailed output
 *
 * Environment Variables:
 *   S3_BUCKET            (required) S3 bucket name
 *   AWS_REGION           AWS region (default: eu-west-2)
 *   SITE_DIR             Build output directory (default: _site)
 *   AMPLIFY_APP_ID       Amplify app ID (required for Amplify deployment)
 *   AMPLIFY_BRANCH_NAME  Amplify branch name (default: main) - also used as S3 folder prefix
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import 'dotenv/config';
import { S3Client } from '@aws-sdk/client-s3';
import { AmplifyClient, StartDeploymentCommand } from '@aws-sdk/client-amplify';
import { S3SyncClient } from 's3-sync-client';
import gitBranch from 'git-branch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// =============================================================================
// Configuration
// =============================================================================

const config = {
	bucket: process.env.S3_BUCKET,
	region: process.env.AWS_REGION || 'eu-west-2',
	siteDir: '_site',
	projectRoot,
	dryRun: process.argv.includes('--dry-run'),
	force: process.argv.includes('--force'),
	skipAmplify: process.argv.includes('--skip-amplify'),
	forceAmplify: process.argv.includes('--force-amplify'),
	verbose: process.argv.includes('--verbose'),
	amplify: {
		appId: process.env.AMPLIFY_APP_ID,
		branchName: process.env.AMPLIFY_BRANCH_NAME || 'main',
	},
	// S3 prefix derived from Amplify branch name
	get s3Prefix() {
		return this.amplify.branchName;
	},
};

// =============================================================================
// Logging Helpers
// =============================================================================

const log = {
	verbose: (msg) => config.verbose && console.log(`   [verbose] ${msg}`),
	info: (msg) => console.log(msg),
	error: (msg) => console.error(msg),
};

// =============================================================================
// AWS Clients (lazy initialisation for better error handling)
// =============================================================================

let s3Client;
let amplifyClient;
let syncClient;

const initAwsClients = () => {
	try {
		s3Client = new S3Client({ region: config.region });
		amplifyClient = new AmplifyClient({ region: config.region });
		syncClient = new S3SyncClient({ client: s3Client });
		log.verbose('AWS clients initialised successfully');
	} catch (error) {
		log.error(`❌ Failed to initialise AWS clients: ${error.message}`);
		log.error('   Check your AWS credentials are configured correctly.');
		process.exit(1);
	}
};

// =============================================================================
// Validation
// =============================================================================

const validateConfig = () => {
	const errors = [];

	if (!config.bucket) {
		errors.push('S3_BUCKET environment variable is required');
	}

	const siteDir = join(config.projectRoot, config.siteDir);
	if (!existsSync(siteDir)) {
		errors.push(
			`${config.siteDir} directory not found. Build your site first.`,
		);
	}

	if (errors.length > 0) {
		errors.forEach((err) => log.error(`❌ ${err}`));
		process.exit(1);
	}
};

const validateGitBranch = async () => {
	if (config.force) {
		log.info('⚠️  Force mode - bypassing branch check');
		return;
	}

	try {
		const branch = await gitBranch(config.projectRoot);
		log.info(`📌 Git branch: ${branch}`);

		if (branch !== 'main') {
			log.info('⛔ Deployment only allowed from main branch.');
			log.info('   Commit and merge to main, or use --force to bypass.');
			process.exit(1);
		}
	} catch (error) {
		log.error(`❌ Could not determine git branch: ${error.message}`);
		process.exit(1);
	}
};

// =============================================================================
// Deployment Functions
// =============================================================================

const syncToS3 = async () => {
	const siteDir = join(config.projectRoot, config.siteDir);
	const bucketUrl = `s3://${config.bucket}/${config.s3Prefix}`;

	log.info(`\n📦 Syncing to ${bucketUrl}`);
	log.info(`   Source: ${siteDir}`);
	log.info(`   Region: ${config.region}`);
	log.info(`   Prefix: ${config.s3Prefix}/`);

	if (config.dryRun) {
		log.info(`   Mode: DRY-RUN\n`);
	} else {
		log.info('');
	}

	const result = await syncClient.sync(siteDir, bucketUrl, {
		del: true,
		dryRun: config.dryRun,
	});

	const created = result.created ?? [];
	const deleted = result.deleted ?? [];
	const uploadCount = created.length;
	const deleteCount = deleted.length;

	if (uploadCount > 0) {
		log.info('  Uploaded:');
		created.forEach((item) => log.info(`    ✓ ${item.id}`));
	}

	if (deleteCount > 0) {
		log.info('  Deleted:');
		deleted.forEach((item) => log.info(`    ✗ ${item.id}`));
	}

	if (uploadCount === 0 && deleteCount === 0) {
		log.info('  No changes detected');
	}

	log.info(`\n   Total uploaded: ${uploadCount} file(s)`);
	log.info(`   Total deleted:  ${deleteCount} file(s)`);

	return {
		uploadCount,
		deleteCount,
		hasChanges: uploadCount > 0 || deleteCount > 0,
	};
};

const triggerAmplifyDeployment = async () => {
	const { appId, branchName } = config.amplify;
	const sourceUrl = `s3://${config.bucket}/${config.s3Prefix}/`;

	log.info(`\n🚀 Triggering Amplify deployment`);
	log.info(`   App ID: ${appId}`);
	log.info(`   Branch: ${branchName}`);
	log.info(`   Source: ${sourceUrl}`);

	if (config.dryRun) {
		log.info(`   [DRY-RUN] Would trigger deployment`);
		return;
	}

	const response = await amplifyClient.send(
		new StartDeploymentCommand({
			appId,
			branchName,
			sourceUrl,
			sourceUrlType: 'BUCKET_PREFIX',
		}),
	);

	log.info(`   ✓ Deployment triggered (Job ID: ${response.jobSummary?.jobId})`);
};

// =============================================================================
// Main
// =============================================================================

const main = async () => {
	log.info('\n🚀 S3 + Amplify Deployer\n');

	// Validate configuration
	validateConfig();

	// Git branch check
	await validateGitBranch();

	// Initialise AWS clients
	initAwsClients();

	if (config.dryRun) {
		log.info('📋 DRY-RUN mode enabled');
	}

	if (config.verbose) {
		log.info('🔍 Verbose mode enabled');
	}

	try {
		// Sync to S3
		const { hasChanges } = await syncToS3();

		// Trigger Amplify deployment
		if (config.skipAmplify) {
			log.info('\n⏭️  Skipping Amplify (--skip-amplify)');
		} else if (!config.amplify.appId) {
			log.info('\n⚠️  Skipping Amplify (AMPLIFY_APP_ID not set)');
		} else if (!hasChanges && !config.dryRun && !config.forceAmplify) {
			log.info('\n⏭️  No changes - skipping Amplify deployment');
			log.info('   Use --force-amplify to trigger anyway');
		} else {
			await triggerAmplifyDeployment();
		}

		log.info('\n✅ Done!\n');
	} catch (error) {
		log.error(`\n❌ Deployment failed: ${error.message}`);
		if (config.verbose && error.stack) {
			log.error(`\n${error.stack}`);
		}
		process.exit(1);
	}
};

main();
