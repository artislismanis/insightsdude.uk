/**
 * Site data — the theme-agnostic facts and capability toggles for this site.
 *
 * This is the framework-owned **site-data contract** (see
 * `@eleventy-plugin-themer/core`): identity (title/url/author), cross-cutting
 * data (social, analytics, branding, comments), and capability toggles
 * (`features`). These are theme-swap invariant — they stay put when you change
 * theme. Looks-and-behaviour (colours, typography, footer format) live in
 * `theme.config.mjs`; infra/secrets live in `eleventy.config.mjs`/`.env`.
 *
 * Known keys below are shape-validated at build time; a malformed shape fails
 * the build, and asking for something the active theme can't render warns.
 *
 * `defineSiteData` is an identity helper that gives editors `SiteData`
 * auto-completion via JSDoc.
 */
import { defineSiteData } from '@eleventy-plugin-themer/core';

export default defineSiteData({
	title: 'insightsdude.uk',
	url: 'https://insightsdude.uk/',
	language: 'en',
	description: 'Connecting the dots, unlocking value.',
	author: {
		name: 'Artis Lismanis',
		email: 'artis@lismanis.uk',
		url: 'https://insightsdude.uk/about/',
	},

	// First year of publication — drives the footer copyright range.
	startYear: 2026,
	// Source repository — the footer git-sha links commits here.
	repository: 'https://github.com/artislismanis/insightsdude.uk',
	feedUrl: '/feed.xml',

	branding: {
		favicon: '/favicon.svg',
		// Header logo. Priority: `logo` (image URL) > `wordmark` (styled text)
		// > `site.title`. `wordmark.accent` is the first substring of the text
		// to highlight (rendered in <span class="logo-accent">).
		wordmark: { text: 'insightsdude.uk', accent: '.' },
		// Tagline under the logo: `true` uses `site.description`, or pass a string.
		tagline: 'landing insight where it counts',
	},

	// Capability toggles (site intent). The active theme declares what it can
	// actually implement; a mismatch warns at build time rather than crashing.
	features: {
		rss: true,
		sitemap: true,
		search: false,
	},

	// Social links. Provide `account` (expanded via the platform table) or an
	// explicit `url`. Rendered as brand icons, falling back to text labels.
	social: [
		{
			platform: 'linkedin',
			url: 'https://www.linkedin.com/in/artislismanis/',
			label: 'LinkedIn',
		},
		{
			platform: 'github',
			url: 'https://github.com/artislismanis',
			label: 'GitHub',
		},
		{ platform: 'rss', url: '/feed.xml', label: 'RSS feed' },
	],

	// analytics: { googleAnalytics: '', plausible: '' },
	// comments: { provider: 'disqus', disqus: { shortname: '' } },
});
