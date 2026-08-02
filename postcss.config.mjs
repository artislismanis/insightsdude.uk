/**
 * PostCSS config — defers to the active theme's declared plugins via the
 * `build.postcss.plugins` block in its `theme.json`.
 *
 * Append project-specific plugins to `userPlugins` if needed; they run after
 * the theme defaults (PostCSS evaluates plugins in declaration order).
 */
import path from 'path';
import { fileURLToPath } from 'url';

import { createThemerProject } from '@eleventy-plugin-themer/core';
import { createPostcssConfig } from '@eleventy-plugin-themer/build-vite/postcss';

import { THEME_NAME } from './theme.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const themer = createThemerProject({
	theme: THEME_NAME,
	projectRoot: __dirname,
});

export default await createPostcssConfig(
	themer.postcssOptions({ userPlugins: [] }),
);
