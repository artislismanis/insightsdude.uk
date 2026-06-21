export default {
	'*.{js,ts,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'*.{css,scss}': ['stylelint --fix', 'prettier --write'],
	'*.md': ['prettier --write', 'markdownlint-cli2 --fix'],
	'*.{json,yml,yaml,njk,html}': ['prettier --write'],
};
