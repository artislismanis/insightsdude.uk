import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['__tests__/**/*.test.mjs'],
		// Build runs once globally; allow a generous budget for the build itself.
		globalSetup: ['./__tests__/global-setup.mjs'],
		hookTimeout: 60_000,
	},
});
