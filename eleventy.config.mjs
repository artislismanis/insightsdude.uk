import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

import { HtmlBasePlugin, InputPathToUrlTransformPlugin } from '@11ty/eleventy';
import EleventyPluginNavigation from '@11ty/eleventy-navigation';
import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import EleventyPluginSyntaxhighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import { createThemerProject } from '@eleventy-plugin-themer/core';
import { eleventyPluginThemerVite } from '@eleventy-plugin-themer/build-vite';

import siteData from './content/_data/site.mjs';
import { THEME_NAME, INPUT_DIR, OUTPUT_DIR } from './theme.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Single source of truth for `{ theme, projectRoot }`. Returns pre-bound
// helpers for the themer Eleventy plugin and the Vite/PostCSS adapters so
// these values aren't repeated at every call site.
const themer = createThemerProject({
	theme: THEME_NAME,
	projectRoot: __dirname,
});

export default async function (eleventyConfig) {
	// Draft preprocessor: exclude draft posts in production builds
	// See also: content/_data/eleventyDataSchema.js for draft field validation
	eleventyConfig.addPreprocessor('drafts', '*', (data) => {
		if (data.draft) {
			data.title = `${data.title} (draft)`;
		}

		if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') {
			return false;
		}
	});

	// Theme: metadata, helpers, markdown setup, layout aliases, dir config,
	// override watch targets, theme.js validation, feature discovery (cached
	// on the shared themer context for the build adapter).
	//
	// We call the plugin directly (not via addPlugin) because Eleventy
	// defers `addPlugin` execution until after this function returns, so
	// we'd have no `dir` to spread into the return value. Direct call is
	// still a fully supported entry point. Plugins that don't need `dir`
	// can register via `addPlugin(eleventyPluginThemer, ...)`.
	const { dir: themeDir } = await themer.eleventyPlugin(eleventyConfig, {
		input: INPUT_DIR,
		output: OUTPUT_DIR,
	});

	eleventyConfig.addPlugin(EleventyPluginNavigation);
	eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	// RSS/Atom feed: https://www.11ty.dev/docs/plugins/rss/
	eleventyConfig.addPlugin(feedPlugin, {
		type: 'atom',
		outputPath: '/feed.xml',
		stylesheet: 'feed/pretty-atom-feed.xsl',
		collection: { name: 'posts', limit: 10 },
		metadata: {
			language: siteData.language,
			title: siteData.title,
			subtitle: siteData.description,
			base: siteData.url,
			author: { name: siteData.author.name, email: siteData.author.email },
		},
	});

	// Image optimization - https://www.11ty.dev/docs/plugins/image/#eleventy-transform
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		formats: ['avif', 'webp', 'auto'],
		failOnError: false,
		htmlOptions: {
			imgAttributes: { loading: 'lazy', decoding: 'async' },
		},
		sharpOptions: { animated: true },
	});

	// Vite: production optimisations, asset bundling. Reads cached theme
	// metadata and feature discovery from the themer context populated above.
	//
	// PurgeCSS safelist note: theme defaults (theme.json#build.purgeCSS.safelist)
	// merge with any user-supplied safelist here — theme entries first, user
	// values appended and deduped. Merge logic lives in build-vite/theme-config.mjs.
	eleventyConfig.addPlugin(
		eleventyPluginThemerVite,
		themer.viteOptions({
			optimizations: {
				purgeCSS: true,
				criticalCSS: true,
				minifyHTML: true,
				// preserveNonHtml MUST run before validateLinks so restored files
				// (feed.xml, sitemap.xml, robots.txt) exist when links are checked.
				preserveNonHtml: { extensions: ['xml', 'txt', 'xsl'] },
				validateLinks: true,
			},
		}),
	);

	// Override directories (overrides/**/*.*) are watched by the themer plugin.
	// Only register starter-specific watches here.
	eleventyConfig.addWatchTarget(`./${INPUT_DIR}/**/*.*`);
	eleventyConfig.addWatchTarget('./public/**/*.*');
	eleventyConfig.addWatchTarget('./*.{mjs,js}');

	// Local theme development: when the active theme is `npm link`ed (or a
	// `file:` dep), watch its real on-disk layouts so `.njk` edits trigger a
	// rebuild (Vite HMR already covers SCSS/JS). Resolves the actual path, so
	// it follows the symlink and is harmless for the published package.
	const themeRequire = createRequire(import.meta.url);
	eleventyConfig.addWatchTarget(
		path.dirname(themeRequire.resolve(`${THEME_NAME}/layouts/base.njk`)),
	);

	eleventyConfig.setChokidarConfig({ usePolling: true, interval: 100 });

	eleventyConfig.setServerPassthroughCopyBehavior('copy');
	eleventyConfig.addPassthroughCopy(`./${INPUT_DIR}/feed/pretty-atom-feed.xsl`);

	return {
		dir: themeDir,
		templateFormats: ['md', 'njk'],
		htmlTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		passthroughFileCopy: true,
	};
}
