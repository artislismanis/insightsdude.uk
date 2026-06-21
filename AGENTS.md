# AGENTS.md

Guidance for Claude Code and other AI agents working in this repository. For framework architecture (cascade, override resolution, security model, etc.), read the `@eleventy-plugin-themer` plugin docs — this file covers integration only.

## Project shape

This is an Eleventy site that consumes the `@eleventy-plugin-themer` framework as a black box. The plugin owns theming, cascade, and build integration; this repo owns content, overrides, deployment, and project-level tooling.

**Repo boundary:** This repo and the plugin repo are independent. The only coupling is the published-package consumption. Dev-time configs (ESLint, Stylelint, Prettier, Vitest) are deliberately **not** shared — each repo owns its own tooling end-to-end. The two setups can borrow good patterns from each other and stay roughly aligned, but unifying them (e.g. by exporting "configs" from the plugin) is out of scope. Don't propose it.

Pieces:

- `content/` — site content (pages, posts, `_data/`)
- `overrides/` — theme overrides (`layouts/`, `styles/`, `scripts/`, `features/`, `lib/`)
- `public/` — static passthrough assets
- `eleventy.config.mjs` — the integration: registers `eleventyPluginThemer` (core) + `eleventyPluginThemerVite` (build adapter)
- `scripts/deploy.mjs` — AWS S3 + Amplify deployment

For how the override cascade works under the hood, see the plugin's `CLAUDE.md`.

## Common commands

```bash
npm run dev        # dev server with HMR
npm run build      # clean + production build
npm run serve      # serve _site/

npm run lint       # format + js + css + md
npm run lint:md    # markdownlint only (content authoring)
npm run lint:md:fix

npm run deploy        # deploy to AWS (main only)
npm run deploy:dry    # show what would change
npm run deploy:force  # deploy from any branch
```

## Integration patterns

### Theme configuration

User-facing theme config lives in the default export of `theme.config.mjs` (project root, **not** `content/_data` — a `theme.*` file in the Eleventy data dir would be auto-loaded as a second `theme` global and duplicate array keys like social links). The plugin validates it against the theme's declared schema — unknown top-level keys throw. Inner shapes are unconstrained, so themes can evolve their config without breaking the starter.

### Adding a page or post

1. Create a markdown or `.njk` file under `content/` (or `content/posts/` for blog posts).
2. Front-matter sets layout + navigation + features. Example:

   ```yaml
   ---
   title: My Post
   layout: layouts/post.njk
   features:
     - code-highlighting
   eleventyNavigation:
     key: Posts
     order: 2
   ---
   ```

3. Feature names in the `features` list are validated against features actually available in the cascade (theme + overrides). Schema lives in `content/_data/eleventyDataSchema.js` and pulls from the plugin.

### Overriding a layout, style, script, or feature

Place the file at the matching path under `overrides/`. The plugin's cascade picks the override automatically. No registration needed.

| Override           | Path                                                        |
| ------------------ | ----------------------------------------------------------- |
| Layout             | `overrides/layouts/<name>.njk`                              |
| Style              | `overrides/styles/<name>.scss`                              |
| Feature            | `overrides/features/<name>/index.js` (or `index.auto.js`)   |
| Filter / shortcode | `overrides/lib/filters.mjs`, `overrides/lib/shortcodes.mjs` |

### Build optimizations

Configured in `eleventy.config.mjs` under `optimizations`:

```js
const options = {
  optimizations: {
    purgeCSS: true,
    criticalCSS: true,
    minifyHTML: true,
    validateLinks: true,
    preserveNonHtml: { extensions: ['xml', 'txt', 'xsl'] },
  },
};
```

PurgeCSS safelist patterns merge from three layers — see `README.md` for the merge rules.

### Integration sanity check

`eleventyPluginThemerVite` emits `[themer/build-vite x.y.z] integration check: OK` on startup. Warnings appear if Node, Vite, or `@11ty/eleventy-plugin-vite` versions are outside the plugin's declared peer ranges. Treat warnings as actionable — they usually predict a runtime break.

## Key files

| File                                  | Purpose                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `eleventy.config.mjs`                 | Plugin registration, optimizations, dirs                                          |
| `theme.config.mjs`                    | Theme constants + presentation overrides (validated vs schema)                    |
| `content/_data/site.mjs`              | Site identity + theme-agnostic data (social/analytics/branding/comments/features) |
| `content/_data/eleventyDataSchema.js` | Front-matter validation (uses `featuresFrontMatterSchema`)                        |
| `overrides/lib/filters.mjs`           | Project-specific Nunjucks filters                                                 |
| `overrides/lib/shortcodes.mjs`        | Project-specific shortcodes                                                       |

## Conventions

- **Indentation: tabs (width 2).** `.editorconfig` and Prettier agree. Markdown is space-indented.
- **`lint:js` echoes a success line.** ESLint prints nothing on a clean run, which reads as "did it even run?". The script appends `&& echo "✓ ESLint: no problems"` so a passing run is visible. (This replaced an earlier `DEBUG=eslint:eslint-helpers` hack that surfaced ESLint's internal debug log for the same reason — dropped because it's a private namespace and pulled in `cross-env`.)
- **Markdown linting** is wired through Husky pre-commit; relaxed rules (no MD013/MD033) for content-author ergonomics.
- **Lightweight Vitest suite** at `__tests__/` covers build smoke, content front-matter schema validation, and output sanity. Run with `npm test`.

## Dependencies & security

- **Node 24 LTS.** Pinned in `.nvmrc`, `engines` (`>=24`), the devcontainer image, and CI (via `.nvmrc`).
- **`overrides` in `package.json`** force patched versions of vulnerable _transitive_ deps without downgrading the top-level tools (`npm audit fix --force` would roll `unlighthouse` and `markdownlint-cli2` back several minor versions — worse than the bug). Current overrides and why:
  - `esbuild ^0.28.1` — GHSA-g7r4-m6w7-qqqr (dev-server file read), via `vite`.
  - `@opentelemetry/core ^2.8.0` — GHSA-8988-4f7v-96qf (memory exhaustion), via `unlighthouse → lighthouse → @sentry/node`; clears the whole OTel chain.
  - `markdownlint-cli2 › js-yaml ^4.2.0` and `markdownlint-cli2 › markdown-it ^14.2.0` — GHSA-h67p-54hq-rp68 / GHSA-38c4-r59v-3vqw (DoS); scoped so only markdownlint's tree moves.
- **Accepted (not overridable):** `js-yaml@3.x` via `gray-matter` (Eleventy's front-matter parser) and `@lhci/utils`. The only patched release is `js-yaml@4.2.0`, but `gray-matter` calls the removed `safeLoad()` API — forcing 4.x breaks the build. These are build-time tools parsing **trusted, first-party input** (your front-matter, your lighthouse config); the DoS needs hostile YAML, which can't reach the build. Leave for upstream Eleventy to resolve. CI's audit gate runs at `--audit-level=high`, so these moderates don't fail builds.

## When in doubt

- Plugin internals → read `@eleventy-plugin-themer/CLAUDE.md`
- This repo's structure → read `README.md`
- Don't reach into the plugin's internal modules. Only `@eleventy-plugin-themer/core`, `/build-vite`, and `/theme-base` (plus their documented subpaths) are stable surfaces.
