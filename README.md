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
│   └── notion-sync.yml  # GitHub Action: 2h schedule + manual trigger
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

| Variable | Value | Use |
|----------|-------|-----|
| `--navy` | `#00033D` | Primary dark background |
| `--purple` | `#4800FF` | CTA buttons, accents |
| `--coral` | `#F6413D` | Eyebrows, highlights |
| `--pink` | `#F5A6B1` | Subtle accent |
| `--gray` | `#EFEFF1` | Light section backgrounds |
| `--white` | `#FFFFFF` | Default background |
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

## Changelog

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
