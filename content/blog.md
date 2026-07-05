---
eleventyNavigation:
  key: Blog
  order: 2
---

# Blog

{% set postslist = collections.posts %}
{% include "partials/content/postslist.njk" %}
