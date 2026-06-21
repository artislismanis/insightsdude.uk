/**
 * Plugin wiring smoke test.
 *
 * Cheap, build-free checks that catch the kinds of issues a normal Eleventy
 * build would only surface late (or silently). Designed to fail fast and
 * point at the specific file the operator should fix.
 *
 * Covered:
 *   - Active theme package resolves and `resolveThemeMetadata` succeeds.
 *   - The active theme exports the helper categories the plugin auto-registers.
 *   - `overrides/lib/{filters,shortcodes}.{mjs,js}` (if present) export a
 *     plain-object default with function values.
 *   - Each `overrides/features/<name>/` contains an entry file the plugin
 *     will pick up (`index.auto.js` or `index.js`).
 *   - `overrides/` contains only directories the plugin recognises — orphan
 *     directories silently do nothing and are almost always a typo.
 *   - `overrides/lib/` contains only files the plugin recognises.
 *   - `theme.config.mjs` overrides validate against the theme's
 *     config schema (top-level keys checked strictly).
 */

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect } from 'vitest';
import {
	resolveThemeMetadata,
	themeConfigSchema,
	formatZodIssues,
} from '@eleventy-plugin-themer/core';

import { THEME_NAME } from '../theme.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const overridesDir = path.join(projectRoot, 'overrides');

const RECOGNISED_OVERRIDE_DIRS = new Set([
	'layouts',
	'styles',
	'scripts',
	'features',
	'lib',
]);
const RECOGNISED_LIB_BASENAMES = new Set(['filters', 'shortcodes']);
const RECOGNISED_LIB_EXTS = new Set(['.mjs', '.js']);

describe('active theme', () => {
	it('package can be resolved from the project root', () => {
		// Resolve from a require anchored at the project root so the lookup
		// follows the project's node_modules graph, not the test file's.
		const requireFromRoot = createRequire(
			path.join(projectRoot, 'package.json'),
		);
		expect(() => requireFromRoot.resolve(THEME_NAME)).not.toThrow();
	});

	it('theme metadata loads and has a name', () => {
		const meta = resolveThemeMetadata(projectRoot, THEME_NAME);
		expect(meta).toBeDefined();
		expect(typeof meta.name).toBe('string');
		expect(meta.name.length).toBeGreaterThan(0);
	});

	it('exports at least one helper category the plugin auto-registers', async () => {
		const mod = await import(THEME_NAME);
		const exports = mod.default ?? {};
		const categories = [
			'filters',
			'shortcodes',
			'pairedShortcodes',
			'transforms',
		];
		const present = categories.filter(
			(k) => exports[k] && Object.keys(exports[k]).length > 0,
		);
		// A theme with none of these is technically valid but vanishingly rare;
		// flagging early prevents silent regressions when a theme refactor
		// accidentally drops its filter registry.
		expect(
			present.length,
			`Theme "${THEME_NAME}" exports none of: ${categories.join(', ')}`,
		).toBeGreaterThan(0);
	});
});

describe('overrides/ layout', () => {
	it('contains only recognised subdirectories', () => {
		if (!fs.existsSync(overridesDir)) return;
		const entries = fs.readdirSync(overridesDir, { withFileTypes: true });
		const orphans = entries
			.filter((e) => e.isDirectory() && !RECOGNISED_OVERRIDE_DIRS.has(e.name))
			.map((e) => e.name);
		expect(
			orphans,
			`overrides/ contains directories the plugin will ignore: ${orphans.join(', ')}. ` +
				`Recognised: ${[...RECOGNISED_OVERRIDE_DIRS].join(', ')}`,
		).toEqual([]);
	});
});

describe('overrides/lib/', () => {
	const libDir = path.join(overridesDir, 'lib');

	it('contains only filters.{mjs,js} or shortcodes.{mjs,js}', () => {
		if (!fs.existsSync(libDir)) return;
		const entries = fs.readdirSync(libDir, { withFileTypes: true });
		const orphans = entries
			.filter((e) => e.isFile())
			.filter((e) => {
				const ext = path.extname(e.name);
				const base = path.basename(e.name, ext);
				return (
					!RECOGNISED_LIB_EXTS.has(ext) || !RECOGNISED_LIB_BASENAMES.has(base)
				);
			})
			.map((e) => e.name);
		expect(
			orphans,
			`overrides/lib/ contains files the plugin will ignore: ${orphans.join(', ')}`,
		).toEqual([]);
	});

	for (const basename of ['filters', 'shortcodes']) {
		it(`${basename}.{mjs,js} (if present) exports a default object of functions`, async () => {
			const candidates = ['.mjs', '.js'].map((ext) =>
				path.join(libDir, `${basename}${ext}`),
			);
			const filePath = candidates.find((p) => fs.existsSync(p));
			if (!filePath) return;

			const mod = await import(filePath);
			const def = mod.default;
			expect(
				def,
				`${path.relative(projectRoot, filePath)}: must have a default export`,
			).toBeDefined();
			expect(
				typeof def === 'object' && def !== null && !Array.isArray(def),
				`${path.relative(projectRoot, filePath)}: default export must be a plain object`,
			).toBe(true);
			const nonFunctions = Object.entries(def).filter(
				([, v]) => typeof v !== 'function',
			);
			expect(
				nonFunctions.map(([k]) => k),
				`${path.relative(projectRoot, filePath)}: every value must be a function`,
			).toEqual([]);
		});
	}
});

describe('overrides/features/', () => {
	const featuresDir = path.join(overridesDir, 'features');

	it('every feature directory has an index.auto.js or index.js', () => {
		if (!fs.existsSync(featuresDir)) return;
		const dirs = fs
			.readdirSync(featuresDir, { withFileTypes: true })
			.filter((e) => e.isDirectory());
		const broken = dirs
			.filter((d) => {
				const auto = path.join(featuresDir, d.name, 'index.auto.js');
				const plain = path.join(featuresDir, d.name, 'index.js');
				return !fs.existsSync(auto) && !fs.existsSync(plain);
			})
			.map((d) => d.name);
		expect(
			broken,
			`features/ subdirs missing index.{auto,}.js: ${broken.join(', ')}`,
		).toEqual([]);
	});
});

describe('theme.config.mjs overrides', () => {
	it('validates against the active theme config schema', async () => {
		const themePath = path.join(projectRoot, 'theme.config.mjs');
		if (!fs.existsSync(themePath)) return;

		const mod = await import(themePath);
		const value =
			typeof mod.default === 'function' ? await mod.default() : mod.default;
		if (!value) return;

		const meta = resolveThemeMetadata(projectRoot, THEME_NAME);
		const result = themeConfigSchema(meta).safeParse(value);
		if (!result.success) {
			const allowed =
				Object.keys(meta.config || {}).join(', ') ||
				'(theme declares no config)';
			throw new Error(
				`Invalid theme overrides at theme.config.mjs:\n` +
					`${formatZodIssues(result.error)}\n` +
					`Allowed top-level keys: ${allowed}`,
			);
		}
	});
});
