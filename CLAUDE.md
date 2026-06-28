# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## SEO audit (weekly)

A weekly SEO audit runs as a scheduled Claude Code on the web session. It reviews the site and files `seo`-labeled GitHub issues for findings — and, importantly, for its own tool failures (that is the failure-alert mechanism; e.g. issue #38 reported a missing data source).

The audit pulls ranking data from **DataforSEO over MCP**. It's wired two ways, in priority order:

1. **Primary — custom MCP connector**, configured in the **Claude Code web environment** (the connection that exposes the `mcp__DataforSEO__*` toolset). This is what the live audit uses; the connector holds its own DataforSEO credentials in the web environment.
2. **Fallback — committed `.mcp.json`** at the repo root: a version-controlled definition of the same hosted endpoint, so the data source is reproducible from the repo if the connector is ever removed or unavailable.

Common to both:
- Endpoint: `https://mcp.dataforseo.com/mcp` (Streamable HTTP transport).
- Tools used: `dataforseo_labs_google_domain_rank_overview`, `dataforseo_labs_google_ranked_keywords`.
- First use of either path may surface a one-time approve/trust prompt for the server.
- Manual fallback for ranking data: https://app.dataforseo.com.

**`.mcp.json` fallback specifics:** auth comes from the env var `DATAFORSEO_AUTH_B64` — base64 of the DataforSEO **API** `login:password` (not the dashboard login; the API Access dashboard provides a pre-encoded token), set in the **Claude Code web environment**, never committed (this repo is public — `.mcp.json` only references the var). It configures DataforSEO for any Claude Code session opened in this repo with that var set; it does not host the server (DataforSEO does). Claude Code supports remote `http` MCP servers natively; if the http transport ever fails, the `mcp-remote` npx bridge wrapping the same URL is the documented fallback.

## Jekyll front matter fields

Every `_posts/*.md` file must have these fields or the sync will skip it:
- `title`, `slug`, `date` (YYYY-MM-DD) — required
- `description`, `author`, `post_type`, `category`, `tags`, `image` — optional
- `render_with_liquid: false` — always set (prevents `{{` in Notion content breaking Jekyll)
- `notion_id` — used by the sync script to match existing files for updates

## Key architectural decisions

**Style guide is the visual source of truth** — `styleguide/index.html` (Jekyll page at `/styleguide/`) is a living catalog (Brand, Color, Typography, Spacing & Radii, Buttons, Install Agent, Cards, Agent Cards, Packages, Chips/Highlight, Timeline, FAQ). It links the real `/styles.css` so it can't drift, and inlines only its own `sg-*` page chrome (page furniture — never put `sg-*` rules in `styles.css`). It's `noindex` and not in the site nav. **Read it before building a new page.**

**Design changes arrive as repo-token handoffs → PR.** Tokens (`:root`) + component classes live only in `styles.css` (the system of record); `/styleguide/` is the contract. New designs come from the Claude Design project as vanilla CSS patches **already using the repo's own tokens** (`--orange`, `.btn` — not `--es-*`/`.es-btn`), applied to `styles.css` (+ markup, + `assets/<name>.js` loaded `defer`) in a reviewable PR, diffed visually against `/styleguide/`. Add a specimen for every new component. Token-first: brand tweaks are one-line `:root` edits — never hard-code a hex.

**Nav exists in three places** — `index.html`, `_layouts/post.html`, and `resources/index.html`. Changes to nav must be made in all three. Same for the footer.

**CSS is split by zone** — `styles.css` (homepage + shared: buttons, cards, nav, hero, install-agent), `results.css` (case studies: metric cards, timelines), `blog.css` (blog posts). All use the CSS custom properties in `styles.css` `:root` — the single token source of truth. The README.md brand token table is a mirror that can lag; always use the `:root` block (or the live `/styleguide/`).

**`@font-face` uses root-relative paths** (`/fonts/...`) so fonts load correctly from sub-pages like `/resources/slug/`. Relative paths would break on sub-paths.

**Case studies are not Jekyll** — `results/` pages are plain HTML files with the nav/footer copy-pasted in. They are not compiled by Jekyll and cannot use Liquid or front matter.

**`webflow.eldur.studio`** — a separate Webflow site on a subdomain. Do not touch it. The `CNAME` file only covers the apex domain (`eldur.studio`).

## CI / GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `notion-sync.yml` | Every 2h + manual | Syncs Notion → `_posts/`, commits, pushes |
| `mobile-layout-check.yml` | After Pages deploy + nightly | Runs Playwright tests; files a GitHub issue on failure, auto-closes on success |
