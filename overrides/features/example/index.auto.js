/**
 * Example feature — illustrates the `overrides/features/<name>/` mechanism.
 *
 * Each feature directory is discovered by the framework and bundled by Vite
 * as its own entry point. The plugin prefers `index.auto.js` over
 * `index.js`: the `.auto` variant runs its own setup at import time, so the
 * page just imports the file. The plain `index.js` form expects the page to
 * call an exported `init()`.
 *
 * To use this on a page, declare it in the page's front matter:
 *
 *   ---
 *   features:
 *     - example
 *   ---
 *
 * Delete this directory if you don't want a no-op feature in the build.
 */

if (typeof window !== 'undefined') {
	document.documentElement.dataset.exampleFeature = 'loaded';
}
