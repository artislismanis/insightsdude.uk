// Prettier config
// https://prettier.io/docs/configuration
// Indentation (tabs, width 2) and end-of-line are inherited from .editorconfig.
export default {
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	plugins: ['prettier-plugin-jinja-template'],
	overrides: [
		{
			files: ['**/*.njk'],
			options: {
				parser: 'jinja-template',
			},
		},
		{
			files: ['**/*.jsonc'],
			options: {
				trailingComma: 'none',
			},
		},
		{
			files: ['**/*.md'],
			options: {
				useTabs: false,
			},
		},
	],
};
