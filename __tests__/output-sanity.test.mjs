/**
 * Output sanity test.
 *
 * Cheap structural assertions on the built `_site/`. The build itself is run
 * by `__tests__/global-setup.mjs`, so this file is order-independent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sitePath = path.join(projectRoot, '_site');

function walkHtml(dir) {
	const out = [];
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walkHtml(full));
		else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
	}
	return out;
}

describe('output sanity', () => {
	let pages;

	beforeAll(() => {
		// global-setup.mjs builds _site/ before any test runs.
		pages = walkHtml(sitePath);
	});

	it('built at least 5 HTML pages', () => {
		expect(pages.length).toBeGreaterThanOrEqual(5);
	});

	it('every page has a non-empty <title>', () => {
		const failures = pages.filter((p) => {
			const html = fs.readFileSync(p, 'utf8');
			const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
			return !m || m[1].trim().length === 0;
		});
		expect(failures).toEqual([]);
	});

	it('no href contains a broken templating sentinel', () => {
		// Catches `href="undefined"`, `href=null`, `href=NaN`, etc. — symptoms
		// of broken templating where a value resolved to undefined/null.
		// Tolerates both quoted and unquoted attributes (the HTML minifier
		// strips quotes from "safe" values).
		const failures = [];
		for (const p of pages) {
			const html = fs.readFileSync(p, 'utf8');
			const broken = html.match(
				/href=["']?(undefined|null|NaN|\[object Object\])(["'\s>])/g,
			);
			if (broken) failures.push({ page: path.relative(sitePath, p), broken });
		}
		expect(failures).toEqual([]);
	});

	it('each page declares a charset and viewport', () => {
		const failures = pages.filter((p) => {
			const html = fs.readFileSync(p, 'utf8');
			// Attributes may be quoted or unquoted (HTML minifier strips quotes).
			return (
				!/charset=["']?utf-8/i.test(html) || !/name=["']?viewport/i.test(html)
			);
		});
		expect(failures).toEqual([]);
	});
});

/**
 * Vite optimisations are wired through `eleventyPluginThemerVite` in
 * `eleventy.config.mjs`. These assertions catch silent regressions where the
 * plugin loads but optimisations no-op (e.g. wrong key names, plugin queue
 * order shifts, or a future API change drops one of these passes).
 */
describe('vite optimisations ran', () => {
	let pages;

	beforeAll(() => {
		pages = walkHtml(sitePath);
	});

	it('minifyHTML stripped inter-tag whitespace', () => {
		// html-minifier-terser collapses the boilerplate between <!doctype>
		// and <html>, and between <head>/<body>/their children. If any of
		// those still has a newline between adjacent block tags, the
		// minifier didn't run.
		const failures = pages.filter((p) => {
			const html = fs.readFileSync(p, 'utf8');
			return (
				/<!doctype html>\s*\n/i.test(html) ||
				/<\/head>\s*\n\s*<body/i.test(html)
			);
		});
		expect(failures).toEqual([]);
	});

	it('criticalCSS inlined a <style> block on the homepage', () => {
		const html = fs.readFileSync(path.join(sitePath, 'index.html'), 'utf8');
		// Critters inlines critical CSS as a <style> in the head.
		expect(/<style[^>]*>[\s\S]+?<\/style>/i.test(html)).toBe(true);
	});

	it('rollup emitted a hashed main script bundle', () => {
		const scriptsDir = path.join(sitePath, 'assets', 'scripts');
		expect(fs.existsSync(scriptsDir)).toBe(true);
		const hashed = fs
			.readdirSync(scriptsDir)
			.filter((f) => /^main\.[A-Za-z0-9_-]{6,}\.js$/.test(f));
		expect(hashed.length).toBeGreaterThan(0);
	});

	it('rollup emitted a hashed main CSS bundle', () => {
		const cssDir = path.join(sitePath, 'assets', 'css');
		expect(fs.existsSync(cssDir)).toBe(true);
		const hashed = fs
			.readdirSync(cssDir)
			.filter((f) => /\.[A-Za-z0-9_-]{6,}\.css$/.test(f));
		expect(hashed.length).toBeGreaterThan(0);
	});
});
