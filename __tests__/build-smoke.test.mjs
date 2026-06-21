/**
 * Build smoke test.
 *
 * Asserts the high-level build output. The build itself runs in
 * `__tests__/global-setup.mjs` so this and `output-sanity.test.mjs` share a
 * single populated `_site/` regardless of vitest file ordering.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitePath = path.resolve(__dirname, '..', '_site');

describe('build smoke', () => {
	it('produces _site/index.html', () => {
		expect(fs.existsSync(path.join(sitePath, 'index.html'))).toBe(true);
	});

	it('homepage has a non-empty <main>', () => {
		const html = fs.readFileSync(path.join(sitePath, 'index.html'), 'utf8');
		const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
		expect(match, 'index.html must contain a <main> element').not.toBeNull();
		expect(match[1].trim().length).toBeGreaterThan(0);
	});

	it('emits at least one blog index page', () => {
		expect(fs.existsSync(path.join(sitePath, 'blog', 'index.html'))).toBe(true);
	});
});
