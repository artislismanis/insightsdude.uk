// markdownlint-cli2 config
// https://github.com/DavidAnson/markdownlint-cli2?tab=readme-ov-file#markdownlint-cli2jsonc
export default {
	globs: ['./content/**/*.{md,markdown}', './docs/**/*.md', './*.md'],
	ignores: [
		'./.husky/**',
		'./_site/**',
		'./.11ty-vite/**',
		'./node_modules/**',
		'./public/**',
		'./.unlighthouse/**',
	],
	fix: false,
	config: {
		// https://github.com/DavidAnson/markdownlint?tab=readme-ov-file#rules--aliases
		//'no-inline-html'
		MD033: false,
		// 'line-length', 80 char
		MD013: false,
		// 'single-title'. MD025 counts the front-matter `title:` as an H1 by
		// default, but this theme's layouts render the title from `theme.config`
		// /page data, not from front matter — every built page has exactly one
		// <h1>, the one in the body. Clearing the pattern stops the false match.
		MD025: { front_matter_title: '' },
		// 'first-line-heading'. Content files legitimately open with a Nunjucks
		// comment or `set` block before their heading (content/index.md), and
		// CLAUDE.md is an `@AGENTS.md` include pointer.
		MD041: false,
		// 'no-hard-tabs'. Nunjucks blocks embedded in Markdown follow the
		// project's tab indentation (.editorconfig), which this rule can't scope
		// to code the way it does for fenced blocks.
		MD010: false,
	},
};
