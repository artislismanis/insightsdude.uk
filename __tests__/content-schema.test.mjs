/**
 * Content schema validation.
 *
 * Walks every markdown file under `content/`, parses its front-matter, and
 * validates the technical fields (`draft`, `tags`, `date`, `features`) against
 * the same schema Eleventy uses at build time. Catches authoring mistakes
 * before they reach the build.
 *
 * Style/SEO concerns (title, description, etc.) belong elsewhere — this test
 * is intentionally narrow.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import matter from 'gray-matter';
import { z } from 'zod';
import { describe, it, expect } from 'vitest';
import {
	resolveThemeMetadata,
	featuresFrontMatterSchema,
} from '@eleventy-plugin-themer/core';

import { THEME_NAME } from '../theme.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const contentDir = path.join(projectRoot, 'content');

function walk(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (entry.isFile() && /\.(md|markdown)$/.test(entry.name))
			out.push(full);
	}
	return out;
}

const themeMetadata = resolveThemeMetadata(projectRoot, THEME_NAME);
const featuresSchema = featuresFrontMatterSchema(projectRoot, themeMetadata);

// Note: this schema runs against raw front-matter, so `tags` accepts either
// a scalar or an array. The runtime schema in `content/_data/eleventyDataSchema.js`
// runs *after* Eleventy normalises scalar tags, so it only needs `array(string)`.
// The asymmetry is intentional — keep both in sync if you change either.
const frontMatterSchema = z.object({
	draft: z.boolean().optional(),
	features: featuresSchema,
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	date: z.coerce.date().optional(),
});

describe('content front-matter', () => {
	const files = walk(contentDir);

	it('finds at least one content file', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		const rel = path.relative(projectRoot, file);
		it(`${rel} has valid technical front-matter`, () => {
			const { data } = matter.read(file);
			const result = frontMatterSchema.safeParse(data);
			if (!result.success) {
				const issues = result.error.issues
					.map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
					.join('\n');
				throw new Error(`${rel}\n${issues}`);
			}
		});
	}
});
