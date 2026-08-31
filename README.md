# insightsdude.uk

The source for [insightsdude.uk](https://insightsdude.uk) — a personal blog built with [Eleventy](https://www.11ty.dev/), the `@eleventy-plugin-themer` framework, and the `eleventy-theme-aurora` theme.

This repo owns **content and delivery**: pages and posts under `content/`, theme overrides under `overrides/`, and the AWS deployment. The theme owns the visual design; the plugin is treated as a black box. The working model is to iterate on look-and-feel here via the override cascade, then promote anything reusable up into the aurora theme. For framework internals (cascade resolution, override discovery, security model), see the plugin's own `README.md` / `CLAUDE.md`.

The two dependencies resolve differently: `@eleventy-plugin-themer/core` and `/build-vite` come from **npm** on semver ranges, while `eleventy-theme-aurora` is a **GitHub release tarball** pinned to a tag — it is not published to npm. See `CLAUDE.md` for the local-iteration (`npm link`) workflow.

## Getting Started

```bash
npm install
npm run dev     # Development server
npm run build   # Production build
```

## Scripts

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Start development server with hot reload                     |
| `npm run build`      | Clean and build for production                               |
| `npm run serve`      | Serve the built `_site` directory                            |
| `npm run lint`       | Run all linters (Prettier, ESLint, Stylelint, markdownlint)  |
| `npm test`           | Run the Vitest suite (builds the site first)                 |
| `npm run lighthouse` | Run Lighthouse audit on the built site                       |
| `npm run deploy`     | Deploy to AWS (S3 + Amplify) — see [Deployment](#deployment) |

## Project Structure

```text
theme.config.mjs   # Theme constants + presentation overrides (colours, footer format, toggles)
content/           # Site content (pages, posts, data)
  _data/           # Global data files (site.mjs — identity + social/analytics/branding/…)
  posts/           # Blog posts
overrides/         # Theme overrides
  layouts/         # Custom layout overrides
  styles/          # Custom SCSS overrides
  scripts/         # Custom JS overrides
  features/        # Custom feature overrides
  lib/             # User filters and shortcodes
public/            # Static assets (copied as-is)
__tests__/         # Vitest suite (build smoke, schema, output sanity, wiring)
scripts/           # deploy.mjs (S3 + Amplify)
```

## Configuration

Site configuration lives in **two surfaces**, by design. They are not interchangeable — each owns a different concern, and keeping them separate is deliberate (see [Why two surfaces](#why-two-surfaces) below).

| Surface                             | Exposed as | Owns                                                                                                            |
| ----------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `content/_data/site.mjs`            | `site`     | **Identity & theme-agnostic data** — title, url, author; social, analytics, comments, branding, feature toggles |
| `theme.config.mjs` (default export) | `theme`    | **Presentation only** — colours, typography, navigation, code highlighting, footer format                       |

`site.mjs` is the framework-owned **site-data contract**: its known keys are shape-validated at build time (a bad shape fails the build), and asking for a capability the active theme doesn't implement warns rather than crashes. See `packages/core/docs/spec/template-contract.md` in the themer repo.

Plus build/infra config that is not "site content":

| File                               | Owns                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `theme.config.mjs` (named exports) | Build constants: `THEME_NAME`, `INPUT_DIR`, `OUTPUT_DIR`  |
| `eleventy.config.mjs`              | Build wiring, plugins, optimizations, feed metadata       |
| `.env` (from `.env.example`)       | AWS deploy secrets                                        |
| `*.11tydata.js` + front-matter     | Per-section / per-page structure (layout, tags)           |
| `public/`                          | Site-specific static assets (favicon, social-share image) |

### Which file does a value go in?

Ask, in order:

1. **Would it still be true if you switched themes?** → `site.mjs` (it's a fact about the site).
2. **Is it about how the theme renders or behaves?** → `theme.config.mjs` (validated against the theme's schema — a typo fails the build).
3. **Is it build/deploy infra or a secret?** → `eleventy.config.mjs` / `.env`.

### Don't duplicate — cross-reference with tokens

Values live in **one** home and are referenced elsewhere by token, never copied. The footer already demonstrates this: `theme.config.mjs` sets `copyright: '© {year} {site.title}'`, and the theme interpolates `{site.title}` from `site.mjs` at render time. Follow this pattern; don't paste the title into both files.

Known single-source-of-truth points to keep in sync manually (no token bridge yet):

- **Feed URL** `/feed.xml` appears in `eleventy.config.mjs` (`outputPath`), the RSS entry in `site.mjs` `social`, and `site.mjs` `feedUrl` — keep them aligned.
- **Repo URL** appears in `package.json` (repository/bugs/homepage) and `site.mjs` `repository`.

### Config checklist — the basic set to review and complete

**`content/_data/site.mjs`** (identity + data)

- [x] `title`, `url`, `language`, `author.name` / `email` / `url`
- [x] `social` (LinkedIn + GitHub + RSS), `startYear`, `repository`, `feedUrl`, `features`
- [x] `description` — drives both `<meta description>` and the feed subtitle
- [ ] `analytics` — commented out; add Google Analytics / Plausible if wanted
- [x] `branding.favicon` — set to `/favicon.svg`; see favicon note below
- [ ] `comments` — commented out; uncomment and set `disqus.shortname` to enable

**`theme.config.mjs`** (presentation)

The default export is empty (`defineThemeConfig({})`) — footer format, toggles, colours (wine accent `#9b3b54`) and typography all come from aurora's own defaults. Add keys only to diverge.

**`public/`**

- [ ] Favicon / social-share image. Note: aurora ships its own `favicon.svg` default, so the repo's `public/favicon.ico` is currently **orphaned** (copied to `_site/` but not referenced). Either delete it, or add your own favicon and point `site.mjs` `branding.favicon` at it.

**`.env`** (from `.env.example`)

- [ ] AWS deploy vars before the first `npm run deploy`

### Why two surfaces

`site.mjs` is **theme-agnostic** — it survives a theme swap untouched, follows Eleventy's idiomatic `site` global, and feeds SEO/feed/structured-data. Its data keys are validated against the framework's site-data contract, not the theme. `theme.config.mjs` is **theme-coupled** — its keys are strictly validated against the active theme's `theme.json#config`, so it only makes sense in the context of a specific theme. Merging them would re-couple your identity to the theme schema and lose that validation boundary.

> **Landed.** Theme-agnostic data — `social`, `analytics`, `comments`, `branding`/favicon — now lives in `site.mjs` under the framework **site-data contract** (themer contract v1); the theme owns only rendering. (These previously sat in `theme.config.mjs`.) See `packages/core/docs/spec/template-contract.md` in the themer repo.

## Linting & Formatting Configs

ESLint, Stylelint, Prettier, markdownlint, Vitest, husky, and lint-staged configs in this repo are intentionally **independent** of the plugin repo's. The plugin treats consumer dev tooling as out of scope: only its runtime API is part of the public contract.

Practical implications:

- The configs here will visually overlap with the plugin's, and that's fine — don't try to share them via a `@eleventy-plugin-themer/configs` package.
- When the plugin tightens a rule (e.g. an ESLint upgrade), it doesn't propagate here automatically. Bring changes over by hand if you want them.
- Conversely, project-specific relaxations or stylistic preferences live here and never reach the plugin.

If a rule starts feeling load-bearing across both repos, that's a signal to revisit — but the current default is "duplication is cheaper than coupling".

## Customizing PurgeCSS Safelist

The production build runs PurgeCSS to remove unused CSS. The safelist (patterns preserved from purging) merges from three layers:

1. **Build plugin defaults** -- generic state class patterns (`is-*`, `has-*`, `js-*`, `page-*`)
2. **Theme** -- declared in the theme's `theme.json` under `build.purgeCSS.safelist`
3. **Site config** -- declared in `eleventy.config.mjs` (this repo)

Layers 2 and 3 follow the framework's general merge rule: theme array entries come first and the site appends (deduped). Object keys: site wins. See the [build-vite optimization merge docs](node_modules/@eleventy-plugin-themer/build-vite/README.md#how-optimizations-merges-with-themejsonbuild) for the full rule.

If you add a feature that uses CSS selectors applied dynamically via JavaScript (not present in the static HTML), you need to safelist those patterns. Pass an object to `purgeCSS` instead of `true`:

```js
// eleventy.config.mjs
await eleventyConfig.addPlugin(eleventyPluginThemerVite, {
  theme: THEME_NAME,
  projectRoot: __dirname,
  optimizations: {
    purgeCSS: {
      safelist: {
        deep: [/my-custom-widget/], // Preserve selectors containing this pattern
        standard: [/^widget-/], // Preserve classes starting with "widget-"
      },
    },
    criticalCSS: true,
    minifyHTML: true,
    validateLinks: true,
    preserveNonHtml: {
      extensions: ['xml', 'txt', 'xsl'],
    },
  },
});
```

The safelist supports three types of patterns (matching [PurgeCSS safelist options](https://purgecss.com/safelisting.html)):

- **`standard`** -- classes matching these patterns are preserved
- **`deep`** -- entire CSS rules are preserved if the selector contains a match
- **`greedy`** -- like `deep` but also preserves child selectors

## Deployment

The site is hosted on **AWS S3 + Amplify**. `scripts/deploy.mjs` syncs the built `_site/` to an S3 bucket (under a branch-named prefix) and triggers an Amplify Hosting deployment. By default it only deploys from the `main` branch.

```bash
npm run build        # produce _site/
npm run deploy       # sync to S3 + trigger Amplify (main only)
npm run deploy:dry   # show what would change, no writes
npm run deploy:force # bypass the main-branch gate
```

Configure the required credentials and identifiers in `.env` (see `.env.example`): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `AMPLIFY_APP_ID`, `AMPLIFY_BRANCH_NAME`.
