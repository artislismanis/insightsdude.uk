---
title: Layout Shortcodes Demo
layout: base.njk
eleventyNavigation:
  key: Shortcodes Demo
  order: 5
description: Demonstration of the layout grid, box, and hero paired shortcodes
features:
  - code-highlighting
---

<h1>{{ title }}</h1>

This page demonstrates the paired shortcodes for layouts and content boxes.

## Hero Section

The `hero` shortcode creates a full-width hero with an optional background image,
title, subtitle, and action buttons.

{% hero title="Welcome to Our Platform", subtitle="Build beautiful websites with ease using our modern theme framework", align="center", height="350px" %}
{% heroButton url="/about", variant="primary" %}Get Started{% endheroButton %}
{% heroButton url="/blog", variant="secondary" %}Learn More{% endheroButton %}
{% endhero %}

### Hero usage

```jinja2
{% raw %}{%
  hero
  title="Welcome",
  subtitle="Build with ease",
  align="center"
%}
  {% heroButton url="/about", variant="primary" %}
    Get Started
  {% endheroButton %}
  {% heroButton url="/blog", variant="secondary" %}
    Learn More
  {% endheroButton %}
{% endhero %}{% endraw %}
```

Hero parameters: `title`, `subtitle`, `background` (image URL), `backgroundColor`
(fallback), `align` (`left`/`center`/`right`, default `center`), `height`,
`overlay` (dark overlay on background images, default `true`).

## Content Grid with Boxes

The `contentGrid` shortcode creates a responsive grid; `box` creates the cards
(with optional action links).

{% contentGrid cols=3, gap="1.5rem" %}
{% box title="Fast Performance", link="/about", linkText="Learn More" %}

<p>Built with modern tools and optimized for speed.</p>
{% endbox %}
{% box title="Easy Customization", link="/about", linkText="Explore" %}
<p>Override any theme component with the cascade system.</p>
{% endbox %}
{% box title="Feature Bundles", link="/blog", linkText="See Examples" %}
<p>Load JavaScript features only on the pages that need them.</p>
{% endbox %}
{% endcontentGrid %}

### Grid usage

```twig
{% raw %}{% contentGrid cols=3, gap="1.5rem" %}
  {% box
    title="Fast Performance",
    link="/about",
    linkText="Learn More"
  %}
    <p>Optimized for speed.</p>
  {% endbox %}
  {% box title="Easy Setup" %}
    <p>Cascade overrides win.</p>
  {% endbox %}
{% endcontentGrid %}{% endraw %}
```

Grid parameters: `cols` (default 3; responsive 3 → 2 @768px → 1 @480px), `gap`,
`className`. Box parameters: `title`, `link`, `linkText`, `span`, `className`.

## Unequal Columns

Add `span` to a `box` to cover several grid columns. With `cols=3`, a `span=2`
box plus a `span=1` box gives a 2/3 + 1/3 split:

{% contentGrid cols=3, gap="1.5rem" %}
{% box title="Main — span 2", span=2 %}

<p>This box spans two of the three columns.</p>
{% endbox %}
{% box title="Side — span 1" %}
<p>This box takes the remaining column.</p>
{% endbox %}
{% endcontentGrid %}

With `cols=4`, `span=1` + `span=3` gives a 1/4 + 3/4 split:

{% contentGrid cols=4, gap="1.5rem" %}
{% box title="1/4", span=1 %}

<p>Sidebar-width card.</p>
{% endbox %}
{% box title="3/4", span=3 %}
<p>Wide content card spanning three of the four columns.</p>
{% endbox %}
{% endcontentGrid %}

### Span usage

```twig
{% raw %}{% contentGrid cols=3 %}
  {% box title="Main", span=2 %}<p>Two thirds.</p>{% endbox %}
  {% box title="Side" %}<p>One third.</p>{% endbox %}
{% endcontentGrid %}{% endraw %}
```

## Left-Aligned Hero

{% hero title="Another Hero Example", subtitle="This hero section is left-aligned with different styling", align="left", height="250px" %}
{% heroButton url="#", variant="primary" %}Primary Action{% endheroButton %}
{% endhero %}

## Boxes Without Links

Boxes can be used without action buttons for simple content cards:

{% contentGrid cols=4, gap="1rem" %}
{% box title="Step 1" %}

<p>Install the theme package.</p>
{% endbox %}
{% box title="Step 2" %}
<p>Configure your site.</p>
{% endbox %}
{% box title="Step 3" %}
<p>Add your content.</p>
{% endbox %}
{% box title="Step 4" %}
<p>Deploy!</p>
{% endbox %}
{% endcontentGrid %}
