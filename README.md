# Eldur Studio — Website

Static marketing site for **Eldur Studio** — Custom AI Agents for B2B Growth.

**Live:** [eldur.studio](https://eldur.studio)
**Repo:** [github.com/UberVero/ES2website](https://github.com/UberVero/ES2website)

---

## Stack

| Layer | Tech |
|-------|------|
| Markup | HTML5 (single page, all sections) |
| Styles | Vanilla CSS (custom properties, no framework) |
| Fonts | Basier Circle — self-hosted OTF |
| Blog | Jekyll (GitHub Pages native) |
| Blog sync | Notion → GitHub Actions → `_posts/` (every 2h) |
| Image pipeline | `sharp` — auto-downloads + optimizes blog images to WebP |
| Hosting | GitHub Pages (main branch, root `/`) |
| Domain | eldur.studio via DNS A records |
| Analytics | Fathom (site ID: `FYROQRHW`) |
| Mobile watchdog | **Huginn** — Playwright suite run in GitHub Actions after every deploy |

No build step for the marketing site. Blog sync uses Node.js (`scripts/notion-sync.js`).

---

## Local dev

```bash
python3 -m http.server 3000
# → http://localhost:3000
```

> **Note:** Python's HTTP server caches CSS aggressively. After style changes, hard-refresh with `Cmd+Shift+R` — otherwise the org chart animations stay invisible (elements start at `opacity: 0` and need the fresh keyframe definitions to animate in).

---

## File structure

```
ES2website/
├── index.html           # Single-page site — all sections in order
├── styles.css           # All styles, brand tokens, animations
├── CNAME                # Custom domain for GitHub Pages → eldur.studio
├── README.md
├── DEPLOYMENT.md        # Blog operations guide
├── _config.yml          # Jekyll config (plugins, permalinks, excludes)
├── package.json         # Node deps for sync script (sharp, notion libs)
│
├── .github/workflows/
│   ├── notion-sync.yml          # GitHub Action: 2h schedule + manual trigger
│   └── mobile-layout-check.yml  # Huginn — runs the mobile watchdog
│
├── tests/
│   └── mobile-layout.spec.js    # Huginn — Playwright mobile integrity suite
├── playwright.config.js         # Mobile viewports + base URL for Huginn
│
├── .claude/
│   ├── settings.json            # Registers the SessionStart hook
│   └── hooks/
│       └── session-start.sh     # Installs deps + Playwright browser
│                                 # in Claude Code on the web sessions
│
├── scripts/
│   └── notion-sync.js   # Notion → Markdown + image pipeline
│
├── _posts/              # Auto-generated blog posts (do not edit)
├── _layouts/
│   └── post.html        # Blog post template + JSON-LD schema
│
├── resources/
│   ├── index.html       # Blog listing page at /resources/
│   └── images/
│       ├── blog/        # Auto-generated: optimized blog images (WebP)
│       │   └── [slug]/  # One folder per post, created by sync
│       └── *.png        # Manually added homepage/hero images
│
├── results/             # Case studies — hand-built static HTML (not Jekyll)
│   ├── index.html       # Case study listing page at /results/
│   └── [slug]/
│       └── index.html   # One folder per case study, full design freedom
│
├── assets/
│   ├── favicon.svg
│   ├── logo-nav.png     # Nav logo
│   ├── logo-white.png   # Footer logo (white version)
│   └── social-card.png  # OG image (1200×630)
│
└── fonts/
    ├── BasierCircle-Regular.otf
    ├── BasierCircle-RegularItalic.otf
    ├── BasierCircle-Medium.otf
    ├── BasierCircle-MediumItalic.otf
    ├── BasierCircle-SemiBold.otf
    ├── BasierCircle-SemiBoldItalic.otf
    ├── BasierCircle-Bold.otf
    ├── BasierCircle-BoldItalic.otf
    └── Kamura.otf       # Decorative serif — loaded but not used in hero
```

**Brand source (not in repo):**
`~/Library/Mobile Documents/com~apple~CloudDocs/Eldur Studio/8020 Assets/`

**Content source (not in repo):**
`~/Library/Mobile Documents/com~apple~CloudDocs/Eldur Studio/Eldur_Studio_Custom_AI_Agents_services.pdf`

---

## Brand tokens

> **Source of truth:** `styles.css` `:root` block. Update this table if you change tokens there.

| Variable | Value | Use |
|----------|-------|-----|
| `--black` | `#000000` | Primary dark backgrounds, text |
| `--dark` | `#111111` | Dark cards on dark sections |
| `--orange` | `#ff7a00` | CTAs, links, accents |
| `--orange-dim` | `rgba(255,122,0,0.08)` | Blockquote/tint fills |
| `--red` | `#ee0f0f` | Eyebrows, highlights |
| `--yellow` | `#ffc109` | Emphasis on dark cards |
| `--gradient` | `linear-gradient(90deg, #ff7a00, #ee0f0f)` | Metric numbers, gradient accents |
| `--white` | `#FFFFFF` | Default background |
| `--gray` | `#EFEFF1` | Light section backgrounds |
| `--text-muted` | `rgba(255,255,255,0.65)` | Muted text on dark bg |
| `--border` | `rgba(0,0,0,0.10)` | Card borders |
| `--radius` | `12px` | Default border radius |
| `--radius-lg` | `20px` | Large border radius |
| `--max-w` | `1160px` | Max container width |
| `--font` | Basier Circle | Body copy + headings |
| `--font-heading` | Kamura | Decorative (reserved) |

---

## Page sections

1. **Nav** — Sticky, dark background, flame SVG wordmark, CTA button
2. **Hero** — Headline + before/after org chart illustration
3. **Who this is for** — 3 audience cards
4. **Problem we solve** — 2 dark cards + highlight stat
5. **How we work** — 3-step timeline
6. **Packages** — 3 pricing tiers on dark background
7. **Example agents** — 4 use-case cards
8. **CTA** — Purple background, booking link
9. **FAQ** — Native `<details>`/`<summary>` accordion
10. **Footer** — Logo, tagline, nav links, email contact

All "Schedule a call" links → `https://booking.akiflow.com/veronica-es-new`

---

## Technical decisions

### Hero illustration — Pure CSS org chart
"Before/after" comparison showing the transformation from siloed marketing team → AI agent stack. Built entirely in HTML/CSS — no images, no canvas, no SVG.

- **Left column (Before):** Traditional org chart nodes connected by CSS `::before`/`::after` pseudo-element lines
- **Right column (After):** AI agent cards with staggered `oc-agent-appear` animation and pulsing `oc-agent-glow` keyframe

**Why no image:** Stays crisp at all resolutions, animates on page load, zero file size overhead, trivially editable.

**Responsive scaling:** At `max-width: 960px` → `transform: scale(0.82)`, at `640px` → `scale(0.68)`. Shrinks the chart without reflowing its internal layout.

**Grid alignment:** `.hero__visual` uses `align-self: start` so the chart pins to the top of its grid cell, aligning with the headline. At mobile, `order: -1` moves it above the text.

---

### Hero headline — Basier Circle Bold

Initial version used Kamura (decorative serif) for the hero `<h1>`. Switched to Basier Circle Bold for legibility at large display sizes. Kamura became hard to read at `clamp(38px, 5vw, 62px)`.

```css
.hero__headline {
  font-family: var(--font);       /* Basier Circle — matches section headings */
  font-weight: 700;
  font-size: clamp(38px, 5vw, 62px);
  letter-spacing: -0.03em;
  line-height: 1.08;
}
```

---

### Deployment — GitHub Pages + custom domain

- Repo: `github.com/UberVero/ES2website`
- `CNAME` file in root contains `eldur.studio`
- GitHub Pages: `main` branch, root `/`
- Auto-deploys on every push to `main` (~60 second propagation)
- SSL via Let's Encrypt — auto-provisioned by GitHub after DNS propagation

`webflow.eldur.studio` is kept on Webflow via its own `webflow` CNAME record — unaffected by this setup.

---

### Analytics — Fathom

Single `<script defer>` in `<head>`. Cookie-free, GDPR-compliant, no consent banner required.

```html
<script src="https://cdn.usefathom.com/script.js" data-site="FYROQRHW" defer></script>
```

---

## Deployment

Push to `main` — that's it.

```bash
git add .
git commit -m "describe your change"
git push
```

---

## Huginn — mobile layout watchdog

Named after Odin's raven, who flies out over the world each day and reports back what he saw. Huginn is a little robot that visits eldur.studio on four simulated phones after every deploy and tells us if anything on mobile has regressed. Mobile is where our layout problems usually hide, and humans never catch them until a week later.

### What it actually does

- **Pretends to be four different phones** — iPhone SE, iPhone 14, iPhone 14 Pro Max, Pixel 5.
- **Visits three pages** on each — the homepage, `/results/`, and `/resources/`.
- **Checks four things** on every page:
  1. Does anything stick out past the edge of the screen? (The classic mobile bug.)
  2. Can it see the logo, the hamburger button, and the orange "Schedule a call" pill — all inside the visible area?
  3. When it taps the hamburger, does a menu actually open with Results, Resources, and the email row?
  4. At the bottom of the page, does the footer behave — does every link fit on screen?

That's **48 checks** total. They run in about 30 seconds.

### When it runs

- **Automatically, after every deploy** to `main` — the moment GitHub Pages finishes rebuilding the site.
- **Every day at 12:00 UTC** as a safety net, in case something drifts without a deploy (e.g. a browser update changes behavior).
- **On demand** — anyone with repo access can kick it off manually from the **Actions** tab, optionally against a different URL (useful for testing a preview branch).

### What happens if something breaks

- The "Huginn — Mobile Layout Watchdog" job goes red in the repo's **Actions** tab and GitHub emails you.
- The failure points at the exact page, device, and check that failed, so the fix is usually a one-line change.
- **A GitHub issue is filed automatically** with the `huginn-failure` label. It includes the commit SHA, a link to the run, and a short runbook. If Huginn fails twice on the same commit, the second failure comments on the existing issue instead of spawning a duplicate.
- **Issues auto-close** on the next successful Huginn run, so the Issues tab always reflects what's broken *right now*.
- Manual runs triggered from the Actions UI (`workflow_dispatch`) never file issues — that channel is for testing and would create noise.

### What it doesn't check (intentionally)

- Whether the design is *pretty* — tests can't have opinions on aesthetics.
- Whether copy is correct, images load, or links go to the right place.
- Desktop layout — the initial scope is mobile-only because that's where today's problem lives. Easy to extend later.

### The files

| File | What it does |
|---|---|
| `tests/mobile-layout.spec.js` | The actual checks, written in plain JavaScript (Playwright). |
| `playwright.config.js` | Lists the four phone profiles and the base URL to test against (defaults to `https://eldur.studio`, override with `BASE_URL=...`). |
| `.github/workflows/mobile-layout-check.yml` | The recipe GitHub runs to actually execute Huginn after every deploy. |
| `.claude/hooks/session-start.sh` | Pre-installs the browser Huginn needs inside Claude Code on the web, so future agent sessions are test-ready from the first second. |

### Running it yourself

From the repo root:

```bash
# Against production (default)
npm run test:mobile

# Against a local Jekyll dev server
BASE_URL=http://localhost:4000 npm run test:mobile
```

First-time setup on a new machine requires one command:

```bash
npm install && npx playwright install --with-deps chromium
```

---

## DNS records

Registrar: Namecheap (or check registrar for eldur.studio)

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| A | `@` | `185.199.108.153` | GitHub Pages |
| A | `@` | `185.199.109.153` | GitHub Pages |
| A | `@` | `185.199.110.153` | GitHub Pages |
| A | `@` | `185.199.111.153` | GitHub Pages |
| CNAME | `www` | `ubervero.github.io` | www → GitHub Pages |
| CNAME | `webflow` | `cdn.webflow.com` | Webflow subdomain — keep |

---

## Results / Case Studies section

Case studies live at `/results/` and are **hand-built static HTML** — not Jekyll templated posts. Each case study has full design freedom (timelines, metric cards, comparison tables, unique layouts).

```
/results/                          → listing page
/results/[slug]/index.html         → individual case study
```

**First case study:** `results/people-enrichment-agent/` — Lead Enrichment Agent (Explorium + Notion)

**Content workflow:** Case studies are drafted in the same Notion "Eldur Blog" database as blog posts (using `Post Type = Case Study`). The sync script (`scripts/notion-sync.js`) **skips** entries with that post type so they never become blog posts. The static HTML file is the source of truth — Notion is used for copy drafting only.

**When adding a new case study:**
1. Copy `results/people-enrichment-agent/index.html` as a starting point
2. Place at `results/[new-slug]/index.html`
3. Add a new card to `results/index.html`
4. Each page can look completely different — CSS classes (`.cs-hero`, `.cs-timeline`, `.metric-card`, `.callout-card`, `.cs-table`, `.cs-faq`) are building blocks, not a required template

See `DEPLOYMENT.md` for the full workflow.

---

## Changelog

### 2026-04-14
- **Mobile hamburger menu** — CSS-only `<details>`-based hamburger sitting left of the CTA pill; opens a slide-down panel with Results, Resources, and the email row. Fixes nav overflow on iPhone Safari.
- **Compact mobile footer** — centered, wrap-friendly layout with a thin divider and an email row pinned below its own separator. Absorbs future nav items without any layout work.
- **Huginn — mobile layout watchdog** — Playwright suite (48 checks across 4 phones × 3 pages) that runs automatically after every deploy. See the "Huginn" section above for details.
- Added `.claude/settings.json` + `.claude/hooks/session-start.sh` so future Claude Code web sessions auto-install Playwright and can run Huginn without setup.
- Updated nav HTML in `index.html`, `results/index.html`, `resources/index.html`, `results/people-enrichment-agent/index.html`, and `_layouts/post.html`.

### 2026-04-10
- Added **Results / case studies section** (`/results/`) — hand-built static HTML for per-page design flexibility
- First case study: Lead Enrichment Agent (Explorium + Notion) at `/results/people-enrichment-agent/`
- Updated nav + footer in `index.html`, `resources/index.html`, `_layouts/post.html` with **Results** link
- `scripts/notion-sync.js` now skips entries with `Post Type = Case Study` so they can live in the same Notion database as blog drafts without syncing to `_posts/`
- New CSS: `.results-hero`, `.cs-hero`, `.stat-pill`, `.cs-timeline`, `.metric-card`, `.callout-card`, `.cs-feature-cards`, `.cs-workflow`, `.cs-table`, `.cs-faq`
- Fixed README brand tokens table (was showing stale Webflow-era colors — now matches `styles.css` `:root`)

### 2026-03-31
- Added auto-image pipeline to blog sync: downloads images from Notion, optimizes with `sharp` (WebP, max 1200px), saves locally in `resources/images/blog/[slug]/`
- Fixes broken images caused by expired Notion S3 URLs (1-hour TTL)
- Animated GIFs preserved as-is (not converted to WebP)
- Updated `_layouts/post.html` to use `<picture>` element with WebP support
- Added `sharp` dependency to `package.json`
- Updated GitHub Action to commit `resources/images/blog/` alongside `_posts/`
- Compressed existing hero images to WebP (hero: 112→19KB, webflow: 109→26KB, hipaa: 543→50KB)

### 2026-02-27
- Built before/after org chart illustration in pure HTML/CSS (hero section)
- Fixed `align-self: start` on `.hero__visual` for correct top-alignment in CSS Grid
- Switched hero `<h1>` from Kamura to Basier Circle Bold — legibility fix at large sizes
- Confirmed all "Schedule a call" CTAs point to booking.akiflow.com/veronica-es-new
- Added footer email contact: `info@eldur.studio` with inline SVG mail icon
- Initialized git repo, created `github.com/UberVero/ES2website`, pushed initial commit
- Enabled GitHub Pages (main branch, root) with `CNAME` file → `eldur.studio`
- Configured DNS: 4× A records + www CNAME (existing webflow subdomain untouched)
- Added Fathom Analytics `<script defer>` to `<head>` (site ID: `FYROQRHW`)
