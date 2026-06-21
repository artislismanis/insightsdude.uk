// ESLint config
// https://eslint.org/docs/latest/use/configure/
import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		ignores: [
			'**/node_modules/**',
			'_site/**',
			'.11ty-vite/**',
			'public/**',
			'.unlighthouse/**',
			'coverage/**',
			'**/*.min.js',
		],
	},

	js.configs.recommended,
	importPlugin.flatConfigs.recommended,
	promisePlugin.configs['flat/recommended'],

	// All JS/MJS files: shared parser + base rules
	{
		files: ['**/*.{js,cjs,mjs}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: { ...globals.es2022 },
		},
		rules: {
			'import/order': ['error', { 'newlines-between': 'always' }],
			'no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'prefer-const': 'error',
			'no-var': 'error',
			eqeqeq: ['error', 'always'],
		},
	},

	// Node.js code: everything except browser-side overrides
	{
		files: ['**/*.{js,cjs,mjs}'],
		ignores: ['overrides/scripts/**/*.js', 'overrides/features/**/*.js'],
		languageOptions: { globals: { ...globals.node } },
	},

	// Browser-side overrides: scripts and feature entry points
	{
		files: ['overrides/scripts/**/*.js', 'overrides/features/**/*.js'],
		languageOptions: { globals: { ...globals.browser } },
		rules: {
			'import/no-unresolved': ['error', { ignore: ['^virtual:'] }],
		},
	},

	// Tests run under Node + Vitest
	{
		files: ['__tests__/**/*.{js,mjs}', '**/*.test.{js,mjs}'],
		languageOptions: { globals: { ...globals.node, ...globals.vitest } },
	},

	// Config files: vitest/config is a subpath export not resolvable by eslint-plugin-import
	{
		files: ['**/*.config.mjs', '.markdownlint-cli2.mjs'],
		languageOptions: { globals: { ...globals.node } },
		rules: {
			'import/no-unresolved': ['error', { ignore: ['^vitest/'] }],
		},
	},

	// Prettier (disables conflicting rules) — must be last
	prettierConfig,
];
