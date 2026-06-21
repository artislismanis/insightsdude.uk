/**
 * Eleventy data schema — technical front-matter validation.
 *
 * Defers to the themer-provided helper, which validates the active theme's
 * declared features plus the standard `draft` / `tags` / `date` fields.
 * Style/SEO concerns belong elsewhere (markdownlint, vale, etc.).
 *
 * The helper reads cached theme metadata from the themer context populated
 * by `eleventyPluginThemer` in `eleventy.config.mjs`.
 */
export { themerDataSchema as default } from '@eleventy-plugin-themer/core';
