/**
 * Vitest globalSetup: builds the site once before any test runs.
 *
 * Centralising the build here removes the file-ordering race between
 * `build-smoke.test.mjs` and `output-sanity.test.mjs`. Tests get a populated
 * `_site/` regardless of vitest's parallel file execution.
 */

import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const npxBinary = process.platform === 'win32' ? 'npx.cmd' : 'npx';

export async function setup() {
	execFileSync(npxBinary, ['eleventy'], {
		cwd: projectRoot,
		stdio: 'pipe',
	});
}
