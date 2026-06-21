import os from 'os';
import path from 'path';
import { readdirSync } from 'fs';

const puppeteerChromeDir = path.join(os.homedir(), '.cache/puppeteer/chrome');
const chromeVersions = readdirSync(puppeteerChromeDir);
const chromePath = path.join(
	puppeteerChromeDir,
	chromeVersions[0],
	'chrome-linux64/chrome',
);

console.log('Using Chrome at:', chromePath);

export default {
	outputPath: '.unlighthouse',
	scanner: {
		device: 'desktop', // or 'mobile'
		throttle: false, // disable CPU/network throttling for faster local runs
	},
	debug: true,
	puppeteerOptions: {
		executablePath: chromePath,
	},
	chrome: {
		useSystem: false,
	},
};
