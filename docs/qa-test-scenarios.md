# QA Test Scenarios — eleventy-starter + @eleventy-plugin-themer

End-to-end QA scenarios covering the starter and the themer plugin it consumes. Each scenario lists
**what** is verified, **how** to exercise it, and the **expected** result. Modes:

- **DEV** = `npm run dev` (Eleventy `--serve`, `ELEVENTY_RUN_MODE=serve`)
- **BUILD** = `npm run build` (`clean` + `eleventy`, full Vite optimizations)

Legend for each scenario: `[DEV]`, `[BUILD]`, or `[BOTH]`.

---

## 0. Environment & smoke

| #   | Scenario                   | Mode  | Steps                                    | Expected                                                                                                       |
| --- | -------------------------- | ----- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0.1 | Fresh install              | —     | Delete `node_modules`, run `npm install` | Installs clean, no peer-dep errors; theme package present at `node_modules/@eleventy-plugin-themer/theme-base` |
| 0.2 | Dev server boots           | DEV   | `npm run dev`                            | Server starts (default :8080), no errors, homepage reachable                                                   |
| 0.3 | Production build completes | BUILD | `npm run build`                          | `_site/` cleaned and regenerated, exit 0, no thrown errors                                                     |
| 0.4 | Serve built site           | BUILD | `npm run serve` after build              | `_site` served, homepage renders with styles/scripts                                                           |
| 0.5 | Test suite green           | BUILD | `npm test`                               | Global setup builds `_site`; smoke, output-sanity, content-schema, plugin-wiring suites all pass               |
| 0.6 | Node version gate          | BOTH  | Run on Node < 22                         | Integration check logs a version warning (never throws)                                                        |

---

## 1. Plugin wiring & registration order

| #   | Scenario                            | Mode  | Steps                                                                                                     | Expected                                                                                      |
| --- | ----------------------------------- | ----- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1.1 | Core-before-vite enforced           | BUILD | Temporarily register `eleventyPluginThemerVite` before `eleventyPluginThemer`                             | Build throws: "no themer context found… Register `eleventyPluginThemer` before this plugin"   |
| 1.2 | Missing `theme` option              | BUILD | Remove `theme` from themer options                                                                        | Throws: requires a `theme` option                                                             |
| 1.3 | Missing `projectRoot`               | BUILD | Remove `projectRoot`                                                                                      | Throws: requires a `projectRoot` option                                                       |
| 1.4 | Unknown optimization key            | BUILD | Set `optimizations: { purgeCS: true }` (typo)                                                             | Throws listing valid keys (purgeCSS, criticalCSS, minifyHTML, validateLinks, preserveNonHtml) |
| 1.5 | `createThemerProject` single-source | BOTH  | Inspect that theme/projectRoot defined once and reused by `eleventyPlugin`/`viteOptions`/`postcssOptions` | All adapters resolve the same theme; no duplicate config                                      |
| 1.6 | `dir` available in return           | BOTH  | Confirm `dir.includes` points at theme layouts                                                            | Layout aliases resolve; pages render with correct templates                                   |
| 1.7 | Vite peer deps present              | BUILD | Remove `@11ty/eleventy-plugin-vite`                                                                       | Build throws clear "not installed" error                                                      |
| 1.8 | Theme package.json missing          | BUILD | Point `THEME_NAME` at a non-installed package                                                             | Throws: "Theme package.json not found for …"                                                  |

---

## 2. Theme config cascade (`theme.config.mjs`)

| #    | Scenario                   | Mode  | Steps                                                                            | Expected                                                                             |
| ---- | -------------------------- | ----- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2.1  | Defaults apply             | BOTH  | Empty/minimal `theme.config.mjs` default export                                  | Theme renders with theme.json `config` defaults (colors, typography, footer)         |
| 2.2  | Override merges deep       | BOTH  | Set `colors.light.primary` only                                                  | Single key overridden; sibling color keys retain theme defaults                      |
| 2.3  | Strict-key validation      | BUILD | Add a top-level typo key e.g. `themeTogle: {}`                                   | Build fails: "Invalid theme configuration … Allowed top-level keys: …"               |
| 2.4  | Array replace semantics    | BOTH  | Override `social` array                                                          | User array replaces theme default array entirely (not concatenated, not duplicated)  |
| 2.5  | `null` clears a value      | BOTH  | Set a default key to `null`                                                      | Value cleared, not skipped                                                           |
| 2.6  | Async config function      | BUILD | Export an async function from `theme.config.mjs`                                 | Awaited and validated correctly                                                      |
| 2.7  | Prototype-pollution guard  | BUILD | Add `__proto__`/`constructor`/`prototype` keys                                   | Keys skipped; no pollution; build does not crash on them                             |
| 2.8  | `defineThemeConfig` typing | —     | Confirm identity wrapper                                                         | No runtime change; IDE typings only                                                  |
| 2.9  | Theme toggle defaultTheme  | DEV   | Set `themeToggle.defaultTheme` to `auto`/`light`/`dark`                          | Initial color scheme respects setting; toggle button shows when `showToggle: true`   |
| 2.10 | Footer fields render       | BOTH  | Set `footer.copyright`, `startYear`, `showPoweredBy`, `showGitSha`, `gitHubRepo` | Copyright year range correct, powered-by + git SHA + repo link rendered when enabled |

---

## 3. Layout overrides (cascade)

| #   | Scenario                     | Mode  | Steps                                                                   | Expected                                                 |
| --- | ---------------------------- | ----- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| 3.1 | Theme layout used by default | BOTH  | No override present                                                     | Theme `base/home/post` layouts render                    |
| 3.2 | Layout override wins         | BOTH  | Add `overrides/layouts/post.njk`                                        | User layout shadows theme `post.njk` (source = override) |
| 3.3 | New user layout              | BOTH  | Add `overrides/layouts/custom.njk` + reference via `layout: custom.njk` | Renders user-only layout (source = user)                 |
| 3.4 | `@theme/` partial import     | BOTH  | In an override layout, `{% include "@theme/partials/x.njk" %}`          | Resolves to theme partial via search path                |
| 3.5 | Path traversal blocked       | BOTH  | `@theme/../../etc/passwd` style include                                 | Throws path-traversal error                              |
| 3.6 | Missing layout alias         | BUILD | Reference a layout name not in theme/override                           | Throws: Resource "…" not found in layouts                |
| 3.7 | Partial override precedence  | BOTH  | Place `overrides/layouts/partials/<name>.njk` matching a theme partial  | User partial wins                                        |

---

## 4. Styles & SCSS cascade

| #   | Scenario                    | Mode  | Steps                                                   | Expected                                         |
| --- | --------------------------- | ----- | ------------------------------------------------------- | ------------------------------------------------ |
| 4.1 | Theme styles compile        | BOTH  | Default state                                           | `styles/main.scss` compiles, applied to pages    |
| 4.2 | Style override by name      | BOTH  | Add `overrides/styles/<partial>` matching theme partial | User partial overrides theme                     |
| 4.3 | New style partial extends   | BOTH  | Add a new SCSS partial + import it                      | Additional CSS appears                           |
| 4.4 | `$theme-name` var available | BOTH  | Use `$theme-name` in SCSS                               | Resolves to active theme name                    |
| 4.5 | SCSS include paths          | BOTH  | Import from `node_modules`, user styles, theme styles   | All three resolve                                |
| 4.6 | CSS hashed in build         | BUILD | Inspect `_site/assets/css`                              | `[name].[hash].css` emitted (output-sanity test) |
| 4.7 | CSS code split              | BUILD | Multiple style entries                                  | `cssCodeSplit` produces split bundles            |

---

## 5. Scripts & feature bundling

| #    | Scenario                            | Mode  | Steps                                               | Expected                                                                                 |
| ---- | ----------------------------------- | ----- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 5.1  | `overrides/scripts/main.js` bundles | BOTH  | Default `console.log('Site loaded')`                | Bundled and loaded in page                                                               |
| 5.2  | Auto-import prepends theme entries  | BOTH  | Inspect built main bundle                           | Theme `styles/main.scss` + `scripts/main.js` auto-imported into user main                |
| 5.3  | Main JS hashed in build             | BUILD | Inspect `_site/assets/scripts`                      | `main.[hash].js` emitted                                                                 |
| 5.4  | Feature discovery (theme)           | BOTH  | `code-highlighting` declared in theme.json          | Discovered, available as `/code-highlighting.js` entry                                   |
| 5.5  | Feature discovery (user)            | BOTH  | `overrides/features/example/index.auto.js` present  | Discovered (source = user)                                                               |
| 5.6  | `index.auto.js` preferred           | BOTH  | Provide both `index.auto.js` and `index.js`         | Auto-init variant chosen                                                                 |
| 5.7  | User feature overrides theme        | BOTH  | Add `overrides/features/code-highlighting/index.js` | User feature shadows theme (source = override)                                           |
| 5.8  | Front-matter `features` gate        | BOTH  | Page with `features: ['example']`                   | Feature script loads only on that page; sets `data-example-feature='loaded'` on `<html>` |
| 5.9  | Invalid feature name                | BUILD | `features: ['does-not-exist']` in front matter      | Build fails: "Invalid feature. Available: …"                                             |
| 5.10 | Feature-serve middleware            | DEV   | Request `/code-highlighting.js` from dev server     | Served via `/@fs…` rewrite (dev only)                                                    |
| 5.11 | Feature bundled in build            | BUILD | Inspect `_site`                                     | Feature emitted as a rollup entry (no dev middleware)                                    |

---

## 6. Filters & shortcodes (overrides/lib)

| #   | Scenario                    | Mode | Steps                                                                          | Expected                                   |
| --- | --------------------------- | ---- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| 6.1 | Theme filters available     | BOTH | Use `dateToFormat`, `filterTagList`, `formatTag`, `head`, `sortAlphabetically` | Render correctly                           |
| 6.2 | User filter registers       | BOTH | `{{ post.content \| readingTime }} min read`                                   | Returns integer minutes (≥1)               |
| 6.3 | User shortcode registers    | BOTH | `{% year %}`                                                                   | Returns current year string                |
| 6.4 | Same-name override wins     | BOTH | Define a filter in `overrides/lib/filters.mjs` matching a theme filter name    | User implementation wins (registered last) |
| 6.5 | Missing lib files tolerated | BOTH | Delete `overrides/lib/filters.mjs`                                             | No error; theme filters still work         |
| 6.6 | `.mjs`/`.js` both tried     | BOTH | Provide `filters.js` instead of `.mjs`                                         | Still discovered                           |

---

## 7. Paired shortcodes (theme-base)

| #   | Scenario                | Mode | Steps                                 | Expected                                                        |
| --- | ----------------------- | ---- | ------------------------------------- | --------------------------------------------------------------- |
| 7.1 | `hero`                  | BOTH | Render `shortcodes-demo.njk`          | `<section class="hero">` with background/overlay/title/subtitle |
| 7.2 | `heroButton`            | BOTH | Inside hero                           | `<a class="hero__button hero__button--primary">`                |
| 7.3 | `contentGrid`           | BOTH | `{% contentGrid cols=3 gap="1rem" %}` | `--grid-cols`/`--grid-gap` custom props set                     |
| 7.4 | `box`                   | BOTH | `{% box title link linkText %}`       | `.content-box` with escaped title + safe link                   |
| 7.5 | Demo page renders fully | BOTH | Open `/shortcodes-demo/`              | All four shortcodes render without template errors              |

---

## 8. Security / escaping (autoescape OFF)

| #   | Scenario                       | Mode  | Steps                                                                  | Expected                                                     |
| --- | ------------------------------ | ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| 8.1 | `escapeHtml`                   | BOTH  | Inject `<script>` into a config value rendered as HTML                 | Rendered as `&lt;script&gt;`                                 |
| 8.2 | `escapeAttr`                   | BOTH  | Inject `"` into an attribute value                                     | Attribute not broken out of                                  |
| 8.3 | `escapeCssValue`               | BOTH  | Set a color/CSS value with `; } injected{`                             | Semicolons/braces/comments stripped                          |
| 8.4 | `escapeJsString`               | BOTH  | Value with quotes + U+2028/U+2029 into inline JS                       | Properly escaped, no script break                            |
| 8.5 | `safeUrl` allowlist            | BOTH  | Set a social/link URL to `javascript:alert(1)` / `vbscript:` / `file:` | Rejected → `#`                                               |
| 8.6 | `safeUrl` obfuscation          | BOTH  | `java\tscript:` and percent-encoded CR/LF in mailto                    | Stripped/rejected                                            |
| 8.7 | `socialUrl` template vs custom | BOTH  | `{platform:'twitter', account:'x'}` vs explicit `url`                  | Custom URL validated by safeUrl; template builds correct URL |
| 8.8 | `socialUrl` mastodon parse     | BOTH  | `@user@instance.social`                                                | Parsed into correct profile URL                              |
| 8.9 | Analytics IDs escaped          | BUILD | Set GA/Plausible IDs with quotes                                       | IDs escaped in emitted inline scripts                        |

---

## 9. Content, collections & navigation

| #   | Scenario                    | Mode  | Steps                    | Expected                                                          |
| --- | --------------------------- | ----- | ------------------------ | ----------------------------------------------------------------- |
| 9.1 | Homepage latest posts       | BOTH  | `/`                      | Shows latest 3 posts from `collections.posts`                     |
| 9.2 | Blog archive                | BOTH  | `/blog/`                 | Lists all posts                                                   |
| 9.3 | Tags index                  | BOTH  | `/tags/`                 | Lists tags via `getKeys \| filterTagList`; reserved tags excluded |
| 9.4 | Tag pages pagination        | BOTH  | `/tags/<slug>/`          | One page per tag, correct posts, excluded from collections        |
| 9.5 | Navigation order            | BOTH  | Header nav               | Home/Archive/About/Privacy in declared `order`                    |
| 9.6 | Nested footer nav           | BOTH  | Footer                   | Privacy nested under `footer` parent                              |
| 9.7 | `posts.11tydata.js` cascade | BOTH  | Any post                 | Inherits `tags: ['posts']` + `layout: post.njk`                   |
| 9.8 | About markdown page         | BOTH  | `/about/`                | Markdown renders with anchors on h2+                              |
| 9.9 | 404 page                    | BUILD | Inspect `_site/404.html` | Generated, excluded from collections                              |

---

## 10. Markdown rendering

| #    | Scenario             | Mode | Steps                  | Expected                                             |
| ---- | -------------------- | ---- | ---------------------- | ---------------------------------------------------- |
| 10.1 | HTML in markdown     | BOTH | Raw HTML in `.md`      | Rendered (`html: true`)                              |
| 10.2 | Linkify              | BOTH | Bare URL in markdown   | Auto-linked                                          |
| 10.3 | Line breaks          | BOTH | Single newlines        | Rendered as `<br>` (`breaks: true`)                  |
| 10.4 | Heading anchors      | BOTH | h2+ headings           | Permalink anchor with visually-hidden assistive text |
| 10.5 | Nunjucks in markdown | BOTH | Shortcode inside `.md` | Processed (markdownTemplateEngine njk)               |

---

## 11. Code highlighting feature

| #    | Scenario                    | Mode  | Steps                                              | Expected                                       |
| ---- | --------------------------- | ----- | -------------------------------------------------- | ---------------------------------------------- |
| 11.1 | Prism highlight             | BOTH  | `firstpost.md` fenced `diff-js` block              | Syntax highlighted                             |
| 11.2 | Diff-highlight              | BOTH  | Diff block                                         | `+`/`-` lines styled via diff-highlight plugin |
| 11.3 | Prism theme selectable      | BOTH  | Set `codeHighlighting.prismTheme` to a valid theme | Theme CSS applied                              |
| 11.4 | Invalid prism theme         | BUILD | Set an invalid prism theme name                    | Throws listing available themes                |
| 11.5 | Feature only when requested | BOTH  | Post without `features: ['code-highlighting']`     | Highlighting JS not loaded on that page        |

---

## 12. Drafts

| #    | Scenario                | Mode  | Steps                        | Expected                                |
| ---- | ----------------------- | ----- | ---------------------------- | --------------------------------------- |
| 12.1 | Draft visible in dev    | DEV   | Post with `draft: true`      | Shown with " (draft)" appended to title |
| 12.2 | Draft excluded in build | BUILD | Same post                    | Not present in `_site/`                 |
| 12.3 | Draft schema validation | BUILD | `draft: "yes"` (non-boolean) | Schema validation error                 |

---

## 13. Feeds, sitemap & non-HTML preservation

| #    | Scenario                 | Mode  | Steps                                        | Expected                                               |
| ---- | ------------------------ | ----- | -------------------------------------------- | ------------------------------------------------------ |
| 13.1 | Atom feed generated      | BUILD | `_site/feed.xml`                             | Valid Atom, ≤10 latest posts, metadata from `site.js`  |
| 13.2 | Pretty feed stylesheet   | BUILD | Open `feed.xml` in browser                   | XSL renders human-readable styled feed                 |
| 13.3 | XSL passthrough          | BUILD | `_site/feed/pretty-atom-feed.xsl`            | Copied as-is                                           |
| 13.4 | Sitemap generated        | BUILD | `_site/sitemap.xml`                          | Lists pages, excludes `permalink:false`, has `lastmod` |
| 13.5 | preserveNonHtml          | BUILD | `xml/txt/xsl` files                          | Survive Vite stage (not dropped by HTML-only pipeline) |
| 13.6 | preserveNonHtml disabled | BUILD | Remove extensions / set `{ extensions: [] }` | Non-HTML files not specially preserved                 |

---

## 14. Image optimization

| #    | Scenario             | Mode  | Steps                       | Expected                               |
| ---- | -------------------- | ----- | --------------------------- | -------------------------------------- |
| 14.1 | Formats generated    | BOTH  | Page with an image          | avif + webp + original emitted         |
| 14.2 | Lazy/async attrs     | BOTH  | `<img>` output              | `loading="lazy" decoding="async"`      |
| 14.3 | Animated GIF         | BOTH  | Animated source             | Animation preserved (`animated: true`) |
| 14.4 | failOnError tolerant | BUILD | Broken/missing image source | Build continues (`failOnError:false`)  |

---

## 15. Build optimizations (minification & friends)

| #     | Scenario                     | Mode  | Steps                                                                                     | Expected                                                  |
| ----- | ---------------------------- | ----- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 15.1  | HTML minified                | BUILD | Inspect any `_site/*.html`                                                                | Inter-tag whitespace + comments removed; reduction logged |
| 15.2  | minifyHTML disabled          | BUILD | `minifyHTML: false`                                                                       | HTML left unminified                                      |
| 15.3  | minifyHTML custom opts       | BUILD | `minifyHTML: { collapseBooleanAttributes:false }`                                         | Option honored                                            |
| 15.4  | Critical CSS inlined         | BUILD | Inspect `<head>`                                                                          | Above-fold CSS inlined in `<style>`, source pruned        |
| 15.5  | criticalCSS via env toggle   | BUILD | `GENERATE_CRITICAL_CSS` flag                                                              | Toggles critical CSS generation cost                      |
| 15.6  | PurgeCSS removes unused      | BUILD | Compare CSS size pre/post                                                                 | Unused selectors removed; reduction % logged              |
| 15.7  | PurgeCSS default safelist    | BUILD | Use `is-*`/`has-*`/`js-*`/`page-*` classes only in JS                                     | Preserved despite not in static HTML                      |
| 15.8  | PurgeCSS theme safelist      | BUILD | Theme safelist (`data-theme`, `language-`, `token`, `diff-highlight`, greedy `language-`) | Preserved; theme greedy patterns stay at head of array    |
| 15.9  | PurgeCSS site safelist merge | BUILD | Add `purgeCSS: { safelist: { deep:[/widget/], standard:[/^widget-/] } }`                  | Merged after theme entries (deduped); selectors preserved |
| 15.10 | PurgeCSS boolean vs object   | BUILD | Switch `purgeCSS: true` ↔ object form                                                     | Both valid; object adds safelist                          |
| 15.11 | All optimizations off        | BUILD | Set every optimization `false`                                                            | Plain unoptimized build still valid                       |

---

## 16. Link validation

| #    | Scenario                   | Mode  | Steps                                         | Expected                            |
| ---- | -------------------------- | ----- | --------------------------------------------- | ----------------------------------- |
| 16.1 | Valid internal links pass  | BUILD | Default content                               | Build passes                        |
| 16.2 | Broken internal link fails | BUILD | Add `<a href="/does-not-exist/">`             | Build fails reporting file + target |
| 16.3 | Missing image fails        | BUILD | `<img src="/missing.png">`                    | Reported as missing-image           |
| 16.4 | External/anchor skipped    | BUILD | `http(s)://`, `mailto:`, `tel:`, `#`, `data:` | Not validated, no false failures    |
| 16.5 | validateLinks disabled     | BUILD | `validateLinks: false`                        | Broken links no longer fail build   |
| 16.6 | Index resolution           | BUILD | Link to a directory with `index.html`         | Treated as valid                    |

---

## 17. PostCSS

| #    | Scenario                    | Mode  | Steps                                           | Expected                                        |
| ---- | --------------------------- | ----- | ----------------------------------------------- | ----------------------------------------------- |
| 17.1 | Theme PostCSS plugins run   | BOTH  | postcss-preset-env (nesting/custom props/media) | Modern CSS transpiled                           |
| 17.2 | cssnano production-only     | BUILD | `production: true` plugin                       | Runs only in production build, minifies CSS     |
| 17.3 | cssnano skipped in dev      | DEV   | Dev server                                      | cssnano not applied                             |
| 17.4 | User PostCSS plugins append | BOTH  | Add to `userPlugins` in `postcss.config.mjs`    | Run after theme plugins                         |
| 17.5 | Missing theme plugin        | BUILD | Uninstall a theme-declared PostCSS plugin       | Throws "declared by the theme is not installed" |

---

## 18. Data files & build metadata

| #    | Scenario                   | Mode  | Steps                                                    | Expected                                                    |
| ---- | -------------------------- | ----- | -------------------------------------------------------- | ----------------------------------------------------------- |
| 18.1 | `site.js` globals          | BOTH  | `{{ site.title }}` etc.                                  | Render in templates + feed                                  |
| 18.2 | Build git SHA              | BOTH  | `{{ build.gitShaShort }}`                                | Resolves from `git rev-parse`; shown in footer when enabled |
| 18.3 | Build timestamp            | BOTH  | `{{ build.timestamp }}`                                  | Present                                                     |
| 18.4 | Theme data file cascade    | BOTH  | Theme `data/*.js` vs user `content/_data/*.js` same name | User file wins (Eleventy native cascade)                    |
| 18.5 | `eleventyDataSchema` wired | BUILD | `themerDataSchema` re-export present                     | Front-matter validated on build                             |

---

## 19. Dev-mode behaviors (watch / HMR)

| #    | Scenario                 | Mode  | Steps                                                     | Expected                                         |
| ---- | ------------------------ | ----- | --------------------------------------------------------- | ------------------------------------------------ |
| 19.1 | Content watch            | DEV   | Edit a `.md`/`.njk` in `content/`                         | Rebuild + reload                                 |
| 19.2 | Override watch           | DEV   | Edit `overrides/**` (layouts/styles/scripts/features/lib) | Rebuild + reload                                 |
| 19.3 | Public watch             | DEV   | Edit `public/**`                                          | Rebuild                                          |
| 19.4 | Config watch             | DEV   | Edit `*.{mjs,js}` config                                  | Server restarts/rebuilds                         |
| 19.5 | Polling under WSL/Docker | DEV   | Run in WSL2                                               | Watching works (`usePolling:true, interval:100`) |
| 19.6 | Nunjucks noCache in dev  | DEV   | Edit a partial repeatedly                                 | Changes always reflected (no stale cache)        |
| 19.7 | Nunjucks cache in build  | BUILD | Production                                                | noCache disabled (perf)                          |

---

## 20. Static assets & passthrough

| #    | Scenario                   | Mode | Steps                            | Expected                                                             |
| ---- | -------------------------- | ---- | -------------------------------- | -------------------------------------------------------------------- |
| 20.1 | `public/` copied           | BOTH | favicon.ico                      | Present at `_site/` root                                             |
| 20.2 | Theme public assets        | BOTH | Theme-provided static assets     | Copied unless user overrode by filename                              |
| 20.3 | User overrides theme asset | BOTH | Put same-named file in `public/` | User asset wins; override logged                                     |
| 20.4 | Server passthrough copy    | DEV  | Dev mode                         | `setServerPassthroughCopyBehavior('copy')` — assets available in dev |

---

## 21. Linting & formatting

| #    | Scenario               | Mode | Steps                                                        | Expected                                              |
| ---- | ---------------------- | ---- | ------------------------------------------------------------ | ----------------------------------------------------- |
| 21.1 | Full lint              | —    | `npm run lint`                                               | Prettier → ESLint → Stylelint → markdownlint all pass |
| 21.2 | ESLint import order    | —    | Reorder imports wrongly                                      | Error flagged                                         |
| 21.3 | ESLint browser globals | —    | Use `window`/`document` in `overrides/scripts` or `features` | Allowed (browser env)                                 |
| 21.4 | Stylelint scope        | —    | Add bad SCSS in `overrides/`                                 | Flagged; `--allow-empty-input` tolerates none         |
| 21.5 | markdownlint           | —    | Malformed markdown                                           | Flagged; `:fix` repairs                               |
| 21.6 | Pre-commit hook        | —    | Stage + commit a badly formatted file                        | Husky + lint-staged auto-fix/format                   |

---

## 22. Performance audit

| #    | Scenario         | Mode  | Steps                             | Expected                                                                             |
| ---- | ---------------- | ----- | --------------------------------- | ------------------------------------------------------------------------------------ |
| 22.1 | Lighthouse run   | BUILD | `npm run lighthouse`              | Spawns server :9999, unlighthouse audits, reports in `.unlighthouse/`, server killed |
| 22.2 | Chrome discovery | —     | Puppeteer Chrome present in cache | Located via configured path                                                          |

---

## 23. Deployment (scripts/deploy.mjs)

> Treat as out-of-framework; test against a sandbox bucket or `--dry-run` only.

| #    | Scenario            | Mode | Steps                         | Expected                                       |
| ---- | ------------------- | ---- | ----------------------------- | ---------------------------------------------- |
| 23.1 | Dry run             | —    | `npm run deploy:dry`          | Reports planned changes, no AWS writes         |
| 23.2 | Branch guard        | —    | Deploy from non-`main` branch | Exits 1 unless `--force`                       |
| 23.3 | Force branch        | —    | `npm run deploy:force`        | Bypasses branch check                          |
| 23.4 | S3 sync delete      | —    | Remove a local file, deploy   | Corresponding S3 object deleted (`del:true`)   |
| 23.5 | S3-only             | —    | `npm run deploy:s3-only`      | Amplify skipped                                |
| 23.6 | Amplify conditional | —    | Deploy with no changes        | Amplify not triggered unless `--force-amplify` |
| 23.7 | Missing S3_BUCKET   | —    | Unset env                     | Clear required-var error                       |
| 23.8 | Branch prefix       | —    | Set `AMPLIFY_BRANCH_NAME`     | Objects land under `<branch>/` prefix          |

---

## 24. Regression / edge cases

| #    | Scenario                                 | Mode  | Steps                                             | Expected                                                                                     |
| ---- | ---------------------------------------- | ----- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 24.1 | Prototype pollution (theme + vite merge) | BUILD | Malicious keys in theme.js and safelist objects   | Stripped at every deep-merge site; no global pollution                                       |
| 24.2 | Empty overrides                          | BOTH  | Empty `overrides/*` dirs (only `.gitkeep`)        | Build/dev succeed using theme defaults                                                       |
| 24.3 | Orphan override dir                      | BUILD | Add unexpected dir under `overrides/`             | plugin-wiring test flags orphan                                                              |
| 24.4 | `lib/` stray file                        | BUILD | Add unrecognized file in `overrides/lib/`         | plugin-wiring test flags it                                                                  |
| 24.5 | Feature dir without entry                | BUILD | `overrides/features/x/` with no `index(.auto).js` | Flagged / not discovered                                                                     |
| 24.6 | Reserved tags filtered                   | BOTH  | `all`/`nav`/`post`/`posts` tags                   | Excluded from tag list output                                                                |
| 24.7 | Output sanity invariants                 | BUILD | `npm test`                                        | ≥5 HTML pages, every page non-empty `<title>`, no `undefined/null/NaN/[object Object]` hrefs |
| 24.8 | Theme swap                               | BOTH  | Change `THEME_NAME` to another conformant theme   | Site rebuilds against new theme without code changes (LSP)                                   |

---

### Coverage map (functionality → sections)

- **Overrides**: 3 (layouts), 4 (styles), 5 (scripts/features), 6 (filters/shortcodes), 2 (data/theme.js)
- **Minification & optimization**: 15 (minify/critical/purge), 16 (links), 17 (PostCSS cssnano)
- **Dev vs build divergence**: 12 (drafts), 5.10/5.11 (feature serve), 17.2/17.3 (cssnano), 19 (watch/cache), 15 (build-only opts)
- **Security/escaping**: 8, 24.1
- **Content/SEO**: 9, 10, 11, 13, 14
- **Tooling/ops**: 0, 21, 22, 23
