# Eleventy Starter

A scaffolding for building static websites with [Eleventy](https://www.11ty.dev/) and the `@eleventy-plugin-themer` framework.

The starter showcases integration patterns; the plugin is treated as a black box. For framework internals (cascade resolution, override discovery, security model), see the plugin's own `README.md` / `CLAUDE.md`.

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
| `npm run lighthouse` | Run Lighthouse audit on the built site                       |
| `npm run deploy`     | Deploy to AWS (S3 + Amplify) — see [Deployment](#deployment) |

## Project Structure

```text
theme.config.mjs   # Theme constants + content overrides (colors, social, footer)
content/           # Site content (pages, posts, data)
  _data/           # Global data files (site.js, build.js)
  posts/           # Blog posts
overrides/         # Theme overrides
  layouts/         # Custom layout overrides
  styles/          # Custom SCSS overrides
  scripts/         # Custom JS overrides
  features/        # Custom feature overrides
  lib/             # User filters and shortcodes
public/            # Static assets (copied as-is)
```

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

Layers 2 and 3 follow the framework's general merge rule: theme array entries come first and the site appends (deduped). Object keys: site wins. See the [build-vite optimization merge docs](../../node_modules/@eleventy-plugin-themer/build-vite/README.md#how-optimizations-merges-with-themejsonbuild) for the full rule.

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

`scripts/deploy.mjs` is an opinionated AWS S3 + Amplify deployment script tailored to this starter's author. It is **not** part of the framework — keep it, replace it, or delete it depending on where you host.

### Swapping in another target

The build output is a plain static site at `_site/`. Any host that serves a directory will work; replace the `deploy` script in `package.json` with whatever your host expects. Common alternatives:

- **Netlify** — `npx netlify deploy --prod --dir=_site` (or connect the repo for git-driven deploys).
- **Cloudflare Pages** — `npx wrangler pages deploy _site` (or connect the repo).
- **GitHub Pages** — push `_site/` to a `gh-pages` branch with a workflow such as `peaceiris/actions-gh-pages`.
- **Vercel** — `npx vercel --prod` (or connect the repo).
- **Plain rsync / scp** — `rsync -avz --delete _site/ user@host:/var/www/yoursite/`.
- **S3 only** (no Amplify) — `aws s3 sync _site/ s3://your-bucket --delete` plus a CloudFront invalidation if fronted by CDN.

If you remove the AWS deploy entirely, also drop the related env vars (`S3_BUCKET`, `AWS_REGION`, `AMPLIFY_APP_ID`, `AMPLIFY_BRANCH_NAME`) from `.env.example` and uninstall the AWS SDK packages from `package.json`.
