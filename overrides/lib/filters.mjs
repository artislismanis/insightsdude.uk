/**
 * Project filters — registered after the theme's filters, so any name that
 * collides with a theme filter (e.g. `escapeHtml`, `dateToFormat`) wins from
 * here.
 *
 * Default export: an object whose keys become Nunjucks filter names. The
 * plugin auto-discovers this file at `overrides/lib/filters.{mjs,js}`.
 *
 * The entries below are illustrative — keep, edit, or delete to taste.
 */

export default {
	/**
	 * Estimate reading time for a chunk of text, in minutes. Uses ~200 wpm.
	 *
	 *   {{ post.content | readingTime }} min read
	 */
	readingTime(text) {
		if (typeof text !== 'string' || text.length === 0) return 0;
		const words = text.trim().split(/\s+/).length;
		return Math.max(1, Math.round(words / 200));
	},
};
