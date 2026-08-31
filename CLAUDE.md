# CLAUDE.md

Guidance for Claude Code and other AI agents working in this repository. For framework architecture (cascade, override resolution, security model, etc.), read the `@eleventy-plugin-themer` plugin docs — this file covers integration only.

## Project shape

This is an Eleventy site that consumes the `@eleventy-plugin-themer` framework as a black box. The plugin owns theming, cascade, and build integration; this repo owns content, overrides, deployment, and project-level tooling.

**Repo boundary:** This repo and the plugin repo are independent. The only coupling is the published-package consumption. Dev-time configs (ESLint, Stylelint, Prettier, Vitest) are deliberately **not** shared — each repo owns its own tooling end-to-end. The two setups can borrow good patterns from each other and stay roughly aligned, but unifying them (e.g. by exporting "configs" from the plugin) is out of scope. Don't propose it.

Pieces:

- `content/` — site content (pages, posts, `_data/`)
- `overrides/` — theme overrides (`layouts/`, `styles/`, `scripts/`, `features/`, `lib/`)
- `public/` — static passthrough assets
- `__tests__/` — Vitest suite (build smoke, front-matter schema, output sanity, plugin wiring)
- `eleventy.config.mjs` — the integration: registers `eleventyPluginThemer` (core) + `eleventyPluginThemerVite` (build adapter)
- `scripts/deploy.mjs` — AWS S3 + Amplify deployment

For how the override cascade works under the hood, see the plugin's `CLAUDE.md`.

## Common commands

```bash
npm run dev        # dev server with HMR
npm run build      # clean + production build
npm run serve      # serve _site/
npm test           # Vitest suite (builds the site first, via global setup)

npm run lint       # format + js + css + md
npm run lint:md    # markdownlint only (content authoring)
npm run lint:md:fix

npm run deploy        # deploy to AWS (main only)
npm run deploy:dry    # show what would change
npm run deploy:force  # deploy from any branch
```

## Integration patterns

### Where the plugin and theme come from

These two resolve differently, and the difference is deliberate:

- **`@eleventy-plugin-themer/core` and `/build-vite` — npm.** Ordinary registry packages on semver ranges.
- **`eleventy-theme-aurora` — GitHub release tarball**, pinned to a tag (`package.json` → `.../archive/refs/tags/vX.Y.Z.tar.gz`). It is **not published to npm**; don't "fix" it to a registry range. Clean installs (CI included) fetch it over plain HTTPS, and the committed `package-lock.json` integrity-pins the exact tarball.

To **iterate on aurora locally** (the override→promote workflow), symlink the sibling checkout over the installed copy:

```bash
cd ../theme-aurora && npm link            # once, registers the global link
cd ../insightsdude.uk && npm link eleventy-theme-aurora
```

Re-run `npm link eleventy-theme-aurora` after any `npm install` (install restores the tarball copy). To ship aurora changes: tag a new aurora release and bump the tag in `package.json`.

### Theme configuration

User-facing theme config lives in the default export of `theme.config.mjs` (project root, **not** `content/_data` — a `theme.*` file in the Eleventy data dir would be auto-loaded as a second `theme` global and duplicate array keys like social links). The plugin validates it against the theme's declared schema — unknown top-level keys throw. Inner shapes are unconstrained, so themes can evolve their config without breaking the starter.

The default export is currently empty (`defineThemeConfig({})`): the palette, footer format, and toggles this site used to set now ship as aurora's own defaults. Add keys back only to diverge from the theme.

### Adding a page or post

1. Create a markdown or `.njk` file under `content/` (or `content/posts/` for blog posts).
2. Front-matter sets navigation + features. Layout names are bare filenames (`post.njk`), not `layouts/`-prefixed paths. Posts inherit `layout` and `tags` from `content/posts/posts.11tydata.js`, so a post only needs its own metadata:

   ```yaml
   ---
   title: My Post
   description: One line for meta description and the feed.
   date: 2026-08-30
   tags:
     - musings
   features:
     - code-highlighting
   ---
   ```

3. Feature names in the `features` list are validated against features actually available in the cascade (theme + overrides). Schema lives in `content/_data/eleventyDataSchema.js` and pulls from the plugin.

### Overriding a layout, style, script, or feature

Place the file at the matching path under `overrides/`. The plugin's cascade picks the override automatically — no registration needed.

**`overrides/README.md` is the reference** for the paths and the resolution rules for each resource type. It sits next to the thing it describes, so read it there rather than trusting a copy here. `theme.config.mjs` carries a shorter version of the same list in its header comment.

### Build optimizations

Configured in `eleventy.config.mjs` under `optimizations`:

```js
const options = {
  optimizations: {
    purgeCSS: true,
    criticalCSS: true,
    minifyHTML: true,
    // preserveNonHtml MUST run before validateLinks so restored files
    // (feed.xml, sitemap.xml, robots.txt) exist when links are checked.
    preserveNonHtml: { extensions: ['xml', 'txt', 'xsl'] },
    validateLinks: true,
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

## Conventions

- **Indentation: tabs (width 2).** `.editorconfig` and Prettier agree. Markdown is space-indented.
- **`lint:js` echoes a success line.** ESLint prints nothing on a clean run, which reads as "did it even run?". The script appends `&& echo "✓ ESLint: no problems"` so a passing run is visible. Don't swap this for a `DEBUG=eslint:*` flag — that's an ESLint-private namespace and it needs `cross-env` to be portable.
- **Husky pre-commit runs `lint-staged`.** The `prepare` script installs the hook on `npm install`, so Prettier and markdownlint (`--fix`) rewrite staged files before they are committed. If a commit reformats files unexpectedly, that's this.
- **Markdown lint rules** are relaxed for content-author ergonomics (no MD013/MD033).
- **Lightweight Vitest suite** at `__tests__/` covers build smoke, content front-matter schema validation, and output sanity. Run with `npm test`.

## Dependencies & security

- **Node 24 LTS.** `.nvmrc` (`24`), `engines` (`>=24`), the devcontainer image (`javascript-node:24`) and CI (via `.nvmrc`) all track the same major, so the container and CI resolve to the same version.
- **`dependencies` vs `devDependencies`.** `dependencies` is everything needed to produce `_site/` or ship it: Eleventy and its plugins, themer, aurora, the Vite/PostCSS/Sass chain, `del-cli`, and the deploy path (`@aws-sdk/*`, `s3-sync-client`, `dotenv`, `git-branch`). `devDependencies` is everything only a person working on the repo needs: linters, formatters, Vitest, `husky`, `lint-staged`, `serve`, `unlighthouse`. `npm ci --omit=dev` installs ~259MB against ~805MB for the full tree and still builds the site — keep it that way when adding a package.
- **`prepare` is `husky || true`** so `npm ci --omit=dev` doesn't fail. npm runs `prepare` on every install, and `husky` isn't there in a production install.
- **Auditing.** The CI gate deliberately audits the **whole** tree at `--audit-level=high`: dev tooling runs on developer machines and in CI with repo access, so it is in scope. Use `npm audit --omit=dev` as a triage question — "does this advisory reach the built site?" — not as the gate.
- **`overrides` in `package.json`** force patched versions of vulnerable _transitive_ deps without downgrading the top-level tools (`npm audit fix --force` would roll `unlighthouse` and `markdownlint-cli2` back several minor versions — worse than the bug). Current overrides:
  - `esbuild ^0.28.1` — GHSA-g7r4-m6w7-qqqr (dev-server file read), via `vite`.
  - `markdownlint-cli2 › js-yaml ^4.3.1` and `markdown-it ^14.2.0` — GHSA-h67p-54hq-rp68 / GHSA-38c4-r59v-3vqw (DoS); scoped so only markdownlint's tree moves.
  - `@puppeteer/browsers ^3.2.1` — GHSA-jmr9-qjv8-65gv (`extract-zip`), which has no upstream patch. Pinning 3.2.1 drops `extract-zip` for `modern-tar` and dedupes onto the copy already under `unlighthouse`, removing it from the tree. Only affects the local `npm run lighthouse` script.
  - `micromatch ^4.0.8` — GHSA-grv7-fg5c-xmjg (`braces` resource exhaustion), reached via `git-branch → findup-sync → micromatch@3`. 4.x is already present via `markdownlint-cli2` and `stylelint`, so this dedupes cleanly and carries the fixed `braces@3`.
- **Accepted (not overridable):** `js-yaml@3.15.1` via `gray-matter` (Eleventy's front-matter parser) and `@lhci/utils`. `gray-matter` calls the removed `safeLoad()` API, so forcing 4.x breaks the build. These are build-time tools parsing **trusted, first-party input** (your front-matter, your lighthouse config); the DoS needs hostile YAML, which can't reach the build. Leave for upstream Eleventy to resolve. CI's audit gate runs at `--audit-level=high`.
- `npm audit` currently reports **0 vulnerabilities**.

## When in doubt

- Plugin internals → read `@eleventy-plugin-themer/CLAUDE.md`
- This repo's structure → read `README.md`
- Don't reach into the plugin's internal modules. Only `@eleventy-plugin-themer/core`, `/build-vite`, and `/theme-base` (plus their documented subpaths) are stable surfaces.
