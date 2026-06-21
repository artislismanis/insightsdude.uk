# Overrides

Theme-shaped customisations. Files placed here win over the theme's defaults via the framework's cascade. Empty directories are intentional scaffolding — drop a file in to override.

Files prefixed with **Example** in the comments are illustrative starting points and safe to delete: `lib/filters.mjs`, `lib/shortcodes.mjs`, `features/example/`. They demonstrate the override mechanism without changing build output.

| Directory   | Purpose                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `layouts/`  | Override theme layouts by filename (e.g. `layouts/post.njk` shadows the theme's).                      |
| `styles/`   | Override or extend theme styles.                                                                       |
| `scripts/`  | Entry point for client JS (`scripts/main.js`) and project-specific scripts.                            |
| `features/` | Override or add JavaScript features. Each feature is a subdirectory with `index.js` / `index.auto.js`. |
| `lib/`      | Auto-discovered: `filters.mjs` and `shortcodes.mjs` default exports are registered with Eleventy.      |

## How overriding works

The plugin walks the theme + overrides cascade for each resource type. The rules below describe how each kind of override is picked up.

### Layouts (`layouts/`)

Resolved by filename. If `overrides/layouts/post.njk` exists, it wins over the theme's `layouts/post.njk`. Layout aliases declared in the theme's `theme.json` are re-pointed automatically.

### Filters and shortcodes (`lib/filters.mjs`, `lib/shortcodes.mjs`)

The plugin registers theme-provided helpers first, then auto-discovers your `lib/{filters,shortcodes}.{mjs,js}` and registers them after with the same `addFilter` / `addShortcode` calls. Eleventy's last-write-wins semantics mean **same-name entries here shadow the theme's**.

The default-exported object's keys are the helper names:

```js
// overrides/lib/filters.mjs
export default {
  myFilter: (value) => value.toUpperCase(),
  // shadowing the theme's `escapeHtml` would happen by name:
  // escapeHtml: customEscape,
};
```

The active theme's helper inventory is the ground truth — read `node_modules/<theme-package>/lib/{filters,shortcodes}.mjs` if you need to know which names to shadow or to copy the implementation as a starting point.

### Features (`features/<name>/`)

Each feature is a directory containing an entry file. The plugin picks **`index.auto.js` over `index.js`** when both are present — `index.auto.js` is the side-effecting / auto-init variant, `index.js` is the explicit-init variant.

Adding `overrides/features/<name>/` with the same `<name>` as a theme feature replaces it (the theme's version is not loaded).

### Styles (`styles/`)

SCSS partials placed here are merged into the theme's style cascade. Use the same partial names as the theme to override; use new names to extend.

### Scripts (`scripts/`)

`scripts/main.js` is the project's main client JS entry point; the build adapter bundles it with all discovered features.
