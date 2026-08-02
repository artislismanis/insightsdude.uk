---
title: My Superpowers
eleventyNavigation:
  key: My Superpowers
  order: 4
---

{#- Each entry: `tag` is the post tag (and /tags/<tag>/ slug), `title` + `blurb`
are the card copy. Replace these with your own core skills. -#}
{%- set skills = [
	{ tag: "data-strategy", title: "Data Strategy", blurb: "Turning messy data landscapes into clear, confident decisions." },
	{ tag: "analytics", title: "Analytics & Measurement", blurb: "Defining the handful of metrics that actually move the needle." },
	{ tag: "deployment", title: "Continuous Delivery", blurb: "Shipping small, safe, and often — releases as a non-event." },
	{ tag: "storytelling", title: "Storytelling with Insight", blurb: "Landing the message where it counts, for the people who decide." }
] -%}

# My Superpowers

The core skills I bring — each card links to the writing where I put it to work. A card gains its link automatically once at least one post is tagged with that skill, so the page grows as I do.

{% contentGrid cols=3 %}{% for s in skills %}{% set skillLink = ("/tags/" + (s.tag | slugify) + "/") if (collections[s.tag] and collections[s.tag].length) else "" %}{% box title=s.title, link=skillLink, linkText="Read related thinking" %}{{ s.blurb }}{% endbox %}{% endfor %}{% endcontentGrid %}
