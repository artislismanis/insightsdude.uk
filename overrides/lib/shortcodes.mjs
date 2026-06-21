/**
 * Project shortcodes — registered after the theme's shortcodes, so any name
 * collision wins from here.
 *
 * Default export: an object whose keys become Nunjucks shortcode names. The
 * plugin auto-discovers this file at `overrides/lib/shortcodes.{mjs,js}`.
 *
 * The entry below is illustrative — keep, edit, or delete to taste.
 */

export default {
	/**
	 * Current year, useful for copyright lines:
	 *
	 *   &copy; {% year %} {{ site.title }}
	 */
	year() {
		return String(new Date().getFullYear());
	},
};
