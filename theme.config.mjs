/**
 * Theme configuration entry point for this starter.
 *
 * Single source of truth for the theme:
 *   - Named exports below: build-level constants shared across the build
 *     (Eleventy, Vite, PostCSS, tests) — so a value lives in exactly one place.
 *   - Default export below: *presentation overrides* (colours, typography,
 *     footer format, toggles). Top-level keys are validated against the active
 *     theme's defaults (`theme.json#config`) at build time, so a typo fails fast.
 *
 * Theme-agnostic *data* (social, analytics, comments, branding) is NOT here —
 * it lives in `content/_data/site.mjs` (the framework site-data contract).
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
 * Presentation overrides for the active theme.
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
 * @see node_modules/eleventy-theme-aurora/theme.json
 *      for all the presentation keys and shapes the active theme supports.
 */
// Empty: the palette, footer format, and toggle defaults this site used to set
// here now ship as aurora's own defaults (v0.3.0+). Add presentation overrides
// back only to diverge from the theme.
export default defineThemeConfig({});
