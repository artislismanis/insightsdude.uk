export default {
	tags: ['posts'],
	layout: 'post.njk',
	permalink: function (data) {
		return `/posts/${data.slug || this.slugify(data.title)}/`;
	},
};
