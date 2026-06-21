import os from 'os';
import path from 'path';
import { existsSync, readdirSync } from 'fs';

// Resolve the puppeteer-managed Chrome, if one is installed. Returns undefined
// when the cache is missing so unlighthouse falls back to its own resolution
// (system Chrome) instead of crashing on a stale/empty cache dir.
function resolvePuppeteerChrome() {
	const chromeDir = path.join(os.homedir(), '.cache/puppeteer/chrome');
	if (!existsSync(chromeDir)) return undefined;

	// Newest install last: directory names sort lexically by version-ish prefix.
	const versions = readdirSync(chromeDir).sort();
	for (const version of versions.reverse()) {
		const candidate = path.join(chromeDir, version, 'chrome-linux64/chrome');
		if (existsSync(candidate)) return candidate;
	}
	return undefined;
}

const chromePath = resolvePuppeteerChrome();
if (chromePath) {
	console.log('Using Chrome at:', chromePath);
} else {
	console.log('No puppeteer Chrome found — falling back to system Chrome.');
}

export default {
	outputPath: '.unlighthouse',
	scanner: {
		device: 'desktop', // or 'mobile'
		throttle: false, // disable CPU/network throttling for faster local runs
	},
	debug: true,
	// Use the puppeteer-managed binary when present; otherwise let unlighthouse
	// find a system Chrome on its own.
	...(chromePath
		? {
				puppeteerOptions: { executablePath: chromePath },
				chrome: { useSystem: false },
			}
		: {}),
};
