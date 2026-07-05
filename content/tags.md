# Tags

<ul>
{%- for tag in collections | getKeys | filterTagList | sortAlphabetically %}
	<li><a href="/tags/{{ tag | slugify }}/" class="post-tag">{{ tag | formatTag }}</a></li>
{%- endfor %}
</ul>
