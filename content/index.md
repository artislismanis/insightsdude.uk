{#- No `eleventyNavigation` here: the theme renders the Home link itself
(navigation.showHomeLink). Adding one would duplicate it in the nav. -#}
{%- set numberOfLatestPostsToShow = 3 -%}
{%- set postsCount = collections.posts | length -%}
{%- set latestPostsCount = postsCount | min(numberOfLatestPostsToShow) -%}

# Latest {{ latestPostsCount }} Post{% if latestPostsCount != 1 %}s{% endif %}

{% set postslist = collections.posts | head(-1 * numberOfLatestPostsToShow) %}
{% set postslistCounter = postsCount %}
{% include "partials/content/postslist.njk" %}

{%- set morePosts = postsCount - numberOfLatestPostsToShow %}
{% if morePosts > 0 %}
<p>{{ morePosts }} more post{% if morePosts != 1 %}s{% endif %} can be found in <a href="/blog/">the archive</a>.</p>
{% endif %}
