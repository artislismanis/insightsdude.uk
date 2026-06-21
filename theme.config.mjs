/**
 * Theme configuration entry point for this starter.
 *
 * Single source of truth for the theme:
 *   - Named exports below: build-level constants shared across the build
 *     (Eleventy, Vite, PostCSS, tests) — so a value lives in exactly one place.
 *   - Default export below: *content overrides* (colors, social links, footer,
 *     analytics, etc.). Top-level keys are validated against the active theme's
 *     defaults (`theme.json#config`) at build time, so a typo fails fast.
 *
 * This file lives at the project root — deliberately NOT in `content/_data` —
 * so it is read only once by the themer plugin. A `theme.*` file inside the
 * Eleventy data dir would also be auto-loaded as a `theme` global and
 * duplicate every array key (e.g. social links) via Eleventy's deep merge.
 *
 * For *code overrides* (filters, shortcodes, layouts, features, styles,
 * scripts) see the `overrides/` directory and `overrides/README.md`.
 */
import { defineThemeConfig } from '@eleventy-plugin-themer/core';

/**
 * Active theme package. Resolved via Node's module resolution; must be a
 * runtime dependency in `package.json`.
 */
export const THEME_NAME = 'eleventy-theme-aurora';

/**
 * Eleventy input directory (relative to project root).
 */
export const INPUT_DIR = 'content';

/**
 * Eleventy output directory (relative to project root).
 */
export const OUTPUT_DIR = '_site';

/* -------------------------------------------------------------------------
 * Where to override what
 * -------------------------------------------------------------------------
 *
 * Theme config (data overrides — colors, copy, toggles):
 *   the `defineThemeConfig({ ... })` default export below
 *   - Strict-key validation against the active theme's defaults; typos fail
 *     the build with the list of valid keys.
 *
 * Layouts (Nunjucks templates):
 *   overrides/layouts/<name>.njk
 *   - A file matching a theme layout name takes precedence (cascade).
 *
 * Filters / shortcodes (additions or by-name shadowing of theme defaults):
 *   overrides/lib/filters.mjs
 *   overrides/lib/shortcodes.mjs
 *   - Theme defaults register first; entries here register after with the
 *     same `addFilter`/`addShortcode` calls, so same-name entries win.
 *
 * Features (auto-init JS modules; replace a theme feature by name):
 *   overrides/features/<name>/index.auto.js   (preferred — auto-init)
 *   overrides/features/<name>/index.js
 *
 * Styles (SCSS partials picked up by the theme cascade):
 *   overrides/styles/...
 *
 * Scripts entry (browser bundle):
 *   overrides/scripts/main.js
 *
 * Static assets (favicon, social images, robots.txt):
 *   public/
 * -------------------------------------------------------------------------
 */

/**
 * Content overrides for the active theme.
 *
 * Only include the values you want to change — anything you omit falls back to
 * the theme's defaults declared in its `theme.json`. Top-level keys are
 * validated **strictly** against those defaults at build time, so a typo here
 * fails fast with a helpful error pointing at the exact key (and the list of
 * valid keys for the active theme).
 *
 * `defineThemeConfig` is an identity helper whose only purpose is to give the
 * editor `ThemeUserConfig` auto-completion via JSDoc.
 *
 * @see node_modules/@eleventy-plugin-themer/theme-base/theme.json
 *      for all the keys and shapes the active theme supports.
 */
export default defineThemeConfig({
	// --- Theme toggle ---------------------------------------------------------
	// Controls dark/light mode behaviour. `defaultTheme` is the initial mode
	// before any user preference; `showToggle` controls whether the header
	// button is rendered.
	themeToggle: {
		defaultTheme: 'auto', // 'auto' | 'light' | 'dark'
		showToggle: true,
	},

	// --- Social links ---------------------------------------------------------
	// Each entry is rendered via the `socialUrl()` filter, which validates the
	// URL protocol (only http/https/mailto/tel/relative are allowed).
	social: [
		{
			platform: 'github',
			url: 'https://github.com/artislismanis',
			label: 'GitHub',
		},
		{
			platform: 'rss',
			url: '/feed.xml',
			label: 'RSS feed',
		},
	],

	// --- Footer ---------------------------------------------------------------
	footer: {
		copyright: ' © {year} Eleventy Starter',
		startYear: 2024,
		showPoweredBy: true,
		showGitSha: true,
		gitHubRepo: 'https://github.com/artislismanis/eleventy-starter',
	},

	// --- Other commonly-overridden sections (uncomment to use) ---------------
	//
	// colors: {
	//   light: { primary: '#172c51', accent: '#ca7033' },
	//   dark:  { primary: '#5b9bd5', accent: '#ca7033' },
	// },
	//
	// typography: {
	//   fontFamily: 'system-ui, sans-serif',
	//   fontFamilyHeading: 'inherit',
	// },
	//
	// analytics: {
	//   googleAnalytics: '',  // e.g. 'G-XXXXXXXXXX'
	//   plausible: '',
	// },
	//
	// codeHighlighting: {
	//   prismTheme: 'prism-tomorrow',
	//   diffHighlight: true,
	// },
	//
	// navigation: {
	//   showHomeLink: true,
	//   pagination: { enabled: true, pageSize: 10 },
	// },
});
