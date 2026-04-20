# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Site overview

Static marketing site for Eldur Studio (eldur.studio), deployed to GitHub Pages from the `main` branch.

**Hybrid architecture — three distinct zones:**
| Zone | Path | Technology |
|------|------|------------|
| Homepage | `index.html` + `styles.css` | Plain HTML/CSS, no build step |
| Blog posts | `_posts/` → `/resources/[slug]/` | Jekyll (Liquid templates, `_layouts/post.html`) |
| Case studies | `results/[slug]/index.html` | Hand-built static HTML (no Jekyll) |

## Running locally

**Homepage only** (no Jekyll needed):
```sh
python3 -m http.server 3000
```
Visit `http://localhost:3000`. Hard-refresh (`Cmd+Shift+R`) after CSS changes — Python's server caches aggressively.

**Full site including blog posts** (requires Jekyll):
```sh
bundle exec jekyll serve
```
Visit `http://localhost:4000`. Required to preview `_posts/` content.

## Running tests

Mobile layout tests (Playwright, runs against live site by default):
```sh
npx playwright test
```

Against local Jekyll server:
```sh
BASE_URL=http://localhost:4000 npx playwright test
```

The test suite ("Huginn") checks four phone viewports (iPhone SE, iPhone 14, iPhone 14 Pro Max, Pixel 5) across `/`, `/results/`, and `/resources/`. Tests guard against horizontal overflow and nav/footer regressions.

## Content sync (Notion → Jekyll)

Blog posts live in a Notion database and sync to `_posts/` via a GitHub Action every 2 hours. To run the sync manually:
```sh
NOTION_API_KEY=... NOTION_DATABASE_ID=... node scripts/notion-sync.js
```

The script (`scripts/notion-sync.js`) downloads and optimizes images (via `sharp`) into `resources/images/blog/[slug]/` and rewrites Markdown image URLs to local paths. Notion S3 image URLs expire in ~1h, which is why images are localized. Posts with `Post Type: Case Study` are intentionally skipped — those live as static HTML under `/results/`.

Required GitHub secrets: `NOTION_API_KEY`, `NOTION_DATABASE_ID`.

## Jekyll front matter fields

Every `_posts/*.md` file must have these fields or the sync will skip it:
- `title`, `slug`, `date` (YYYY-MM-DD) — required
- `description`, `author`, `post_type`, `category`, `tags`, `image` — optional
- `render_with_liquid: false` — always set (prevents `{{` in Notion content breaking Jekyll)
- `notion_id` — used by the sync script to match existing files for updates

## Key architectural decisions

**Nav exists in three places** — `index.html`, `_layouts/post.html`, and `resources/index.html`. Changes to nav must be made in all three. Same for the footer.

**CSS is one file** — `styles.css` covers homepage, blog posts, resources listing, and case studies. It uses CSS custom properties (see `:root` for all tokens). The README.md brand token table is outdated; always use the `:root` block in `styles.css` as the source of truth.

**`@font-face` uses root-relative paths** (`/fonts/...`) so fonts load correctly from sub-pages like `/resources/slug/`. Relative paths would break on sub-paths.

**Case studies are not Jekyll** — `results/` pages are plain HTML files with the nav/footer copy-pasted in. They are not compiled by Jekyll and cannot use Liquid or front matter.

**`webflow.eldur.studio`** — a separate Webflow site on a subdomain. Do not touch it. The `CNAME` file only covers the apex domain (`eldur.studio`).

## CI / GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `notion-sync.yml` | Every 2h + manual | Syncs Notion → `_posts/`, commits, pushes |
| `mobile-layout-check.yml` | After Pages deploy + nightly | Runs Playwright tests; files a GitHub issue on failure, auto-closes on success |
