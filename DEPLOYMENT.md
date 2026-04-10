# Eldur Studio Blog — Deployment & Operations Guide

How the Notion-synced blog at [eldur.studio/resources/](https://eldur.studio/resources/) works, and how to operate it.

---

## How it works

You write in Notion. A GitHub Action picks it up automatically.

```
Notion DB (Status = Published)
  ↓  GitHub Action (every 2h or manual trigger)
  ↓  notion-sync.js → _posts/YYYY-MM-DD-slug.md
  ↓  git commit + push to main
GitHub Pages → Jekyll rebuild (automatic on push)
  ↓
eldur.studio/resources/          ← listing page
eldur.studio/resources/[slug]/   ← individual posts
```

---

## Writing a post

1. Open the **Eldur Blog** database in Notion
2. Create a new entry — fill in **Title**, **Slug**, **Published Date**, **Status = Draft**
3. Write content in the page body (headings, paragraphs, lists, blockquotes all convert cleanly)
4. Add images however you like — **inline images in the post body are handled automatically** (see Image Pipeline below)
5. For the **Featured Image URL** field, you can either:
   - Leave it blank (no hero image on the post)
   - Paste any image URL — the sync script will download and optimize it automatically
   - Upload an image directly in Notion — even though Notion URLs expire, the sync script downloads them before they do
6. Set **Status → Published** when ready
7. Trigger a manual sync (see below) or wait up to 2 hours

---

## Triggering a manual sync

1. Go to [github.com/UberVero/ES2website/actions](https://github.com/UberVero/ES2website/actions)
2. Click **Notion Sync** in the left sidebar
3. Click **Run workflow → Run workflow**
4. Post is live in ~1 minute after the Action completes

---

## Notion database schema

Database ID: `ce0d53fdc6a2489a8201330e13bd3515`

| Property | Type | Required | Notes |
|---|---|---|---|
| Title | Title | ✓ | Post headline |
| Slug | Text | ✓ | URL path — lowercase, hyphens only, e.g. `ai-agents-b2b` |
| Status | Select | ✓ | `Draft` or `Published` — only Published posts sync |
| Published Date | Date | ✓ | Sets post URL and sort order |
| Description | Text | | Excerpt for cards + og:description |
| Author | Text | | Byline (e.g. Veronica) |
| Post Type | Select | | Article, Guide, Case Study, Tutorial. **Case Study entries are skipped by the sync** — they live at `/results/` as hand-built HTML. See "Case Studies" section below. |
| Category | Select | | Guides, Case Studies, AI & Automation, Strategy |
| Tags | Multi-select | | AI Agents, B2B Marketing, One-Person Team, Strategy, Automation |
| Featured Image URL | URL | | Stable URL only — use `resources/images/` in repo or external CDN. Notion S3 URLs expire. |
| Last Modified Date | Date | | Optional, for `dateModified` in schema.org |

---

## Updating a published post

Edit in Notion — any field. The next sync detects the change via `notion_id` in the Markdown
front matter and overwrites the file in place. No duplicate posts.

**If you change the Slug or Published Date:** the old file is deleted and a new one is created at
the new URL. The old URL will 404. Update any links before changing slugs on live posts.

---

## Case Studies (`/results/`)

Case studies are **different from blog posts**. They live at `/results/[slug]/` and are **hand-built static HTML**, not Jekyll-templated posts. This gives each case study full design flexibility (custom timelines, metric cards, unique layouts).

### Content architecture

```
/results/                          → results/index.html (listing page)
/results/[slug]/                   → results/[slug]/index.html (static HTML)
```

Current case studies:
- `/results/people-enrichment-agent/` — Lead Enrichment Agent (Explorium + Notion)

### Workflow — how case studies interact with Notion

You can still draft case study copy in the **Eldur Blog** Notion database (using `Post Type = Case Study`) to keep all content in one place. The sync script **skips** Case Study entries so they never appear as blog posts.

```
Eldur Blog Notion DB
  ↓  Status = Published
  ↓  notion-sync.js reads Post Type
  ├─ "Blog Post" / "Guide" / ... → syncs to _posts/*.md (blog)
  └─ "Case Study" → SKIPPED (static HTML is the source of truth)
```

**This means:** You can safely set a Case Study entry in Notion to `Status = Published` and it will NOT appear on the blog. The sync logs `Skipping Case Study "Title" — hand-built at /results/` and moves on.

### Adding a new case study

1. **Create the static HTML file:**
   - Copy `results/people-enrichment-agent/index.html` as a starting point
   - Save as `results/[new-slug]/index.html`
   - Each case study can look different — the CSS classes (`.cs-hero`, `.cs-timeline`, `.metric-card`, `.callout-card`, `.cs-feature-cards`, `.cs-table`, `.cs-faq`) are building blocks, not a required layout
2. **Add a card to the listing page:** edit `results/index.html` and add a new `<article class="card--case-study">` block linking to the new slug
3. **Update JSON-LD schema inside the new case study:** change `headline`, `description`, `image`, `datePublished`, and the `BreadcrumbList` title
4. **Commit + push:** `git add results/ && git commit -m "feat: new case study" && git push`

### CSS building blocks (in `styles.css`)

| Class | What it is |
|---|---|
| `.results-hero` | Listing page dark hero (mirrors `.resources-hero`) |
| `.card--case-study` | Listing card |
| `.cs-hero` | Case study page hero with breadcrumb + stat pills |
| `.stat-pill` | Inline metric badge (e.g. "98% time reduction") |
| `.cs-section` / `.cs-2col` | Section container + 2-column layout |
| `.callout-card` | Dark card with orange left border (client pain points / quotes) |
| `.cs-feature-cards` / `.cs-feature-card` | 2-column feature comparison |
| `.cs-timeline` / `.cs-timeline__step` | Numbered horizontal/vertical architecture timeline |
| `.cs-workflow` / `.cs-insight` | Numbered workflow steps with pull-quote callout |
| `.cs-metrics` / `.metric-card` | Result metric cards with gradient numbers |
| `.cs-table` / `.cs-table-wrap` | Comparison table with scroll wrapper |
| `.cs-faq` | FAQ accordion using `<details>`/`<summary>` |

### Why static HTML instead of a Jekyll layout

A Jekyll `_layouts/case-study.html` template would force every case study into the same structure. Case studies need to emphasize different things (a timeline for an architecture story, a before/after for a design story, big metrics for a growth story). Hand-built HTML lets each tell its own story.

### Troubleshooting

**Case Study appears on the blog instead of `/results/`**
- Check `Post Type` is exactly `Case Study` in Notion (case-insensitive match, but must spell it right)
- The skip runs in `scripts/notion-sync.js` — look for "Skipping Case Study" in the sync log
- If it already synced once as a blog post, manually delete the file from `_posts/` and commit

**New case study page returns 404**
- File must be named `index.html` inside its folder: `results/[slug]/index.html`
- GitHub Pages takes ~60 seconds to rebuild after push

---

## Unpublishing a post

Change **Status → Draft** in Notion. The sync will no longer update the post, but the existing
`_posts/` file stays live until you delete it from the repo manually.

---

## Image pipeline

Images in blog posts are **automatically downloaded, optimized, and saved locally** during every sync. You no longer need to manually host images or worry about Notion's expiring URLs.

### How it works

```
Notion page with images
  ↓  notion-sync.js detects image URLs in markdown
  ↓  Downloads each image before Notion's 1-hour URL expiry
  ↓  Optimizes with sharp: resize to max 1200px + convert to WebP
  ↓  Saves to resources/images/blog/[post-slug]/img-1.webp
  ↓  Rewrites markdown references to point to local files
  ↓  GitHub Action commits images alongside the post
```

### What you need to know

- **Just add images in Notion** — upload, paste, embed, whatever. The pipeline handles the rest.
- **Featured images** are also processed. Paste any URL in the Featured Image URL field.
- **Images already in the repo** (e.g., `raw.githubusercontent.com/.../resources/images/...`) are left untouched.
- **Animated GIFs** are preserved as-is — they aren't converted to WebP (which would break animation).
- **If a download fails** (network issue, already-expired URL), the original URL is kept and a warning is logged. The post still syncs.
- **Max file size target:** ~150KB per image after optimization (most are well under).
- **Post template** uses `<picture>` element with WebP source for browser compatibility.

### Where images live

```
resources/images/
├── blog/                          # Auto-generated by sync (do not edit)
│   ├── building-hipaa-compliant-ai-agents/
│   │   ├── img-1.webp
│   │   ├── img-2.webp
│   │   ├── img-3.webp
│   │   └── img-featured.webp
│   └── webflow-pro-system-side-project/
│       ├── img-1.webp
│       ├── img-2.gif              # animated GIF, preserved
│       ├── img-3.gif
│       └── img-4.webp
├── ES2-hero-illustration@2x.png   # Manually added homepage images
├── eldur-ai-agents-hero.png
└── eldur-webflow-pro-hero.png
```

### Configuration (in `scripts/notion-sync.js`)

| Setting | Value | What it does |
|---|---|---|
| `MAX_WIDTH` | `1200` | Images wider than this are resized down |
| `WEBP_QUALITY` | `80` | WebP compression quality (0–100) |
| `IMAGES_DIR` | `resources/images/blog` | Where optimized images are saved |

---

## Key files

| File | Purpose |
|---|---|
| `scripts/notion-sync.js` | Queries Notion API, converts pages to Markdown, runs image pipeline |
| `.github/workflows/notion-sync.yml` | GitHub Action: 2h schedule + manual trigger, commits `_posts/` + `resources/images/blog/` |
| `_config.yml` | Jekyll config: permalinks, plugins, excludes |
| `_layouts/post.html` | Post template with JSON-LD schema, og: tags, and `<picture>` WebP support |
| `resources/index.html` | Listing page at `/resources/` |
| `resources/images/blog/` | Auto-generated optimized blog images (do not edit manually) |
| `resources/images/` | Manually added images for homepage/hero |
| `_posts/` | Auto-generated Markdown files from Notion (do not edit manually) |
| `styles.css` | All styles including post prose and resource cards |
| `package.json` | Node dependencies: `@notionhq/client`, `notion-to-md`, `sharp` |

---

## GitHub Secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `NOTION_API_KEY` | Notion integration token (notion.so/my-integrations) |
| `NOTION_DATABASE_ID` | `ce0d53fdc6a2489a8201330e13bd3515` |

---

## Re-setup checklist

If you ever need to rebuild this from scratch:

- [ ] Create Notion integration at notion.so/my-integrations
- [ ] Share **Eldur Blog** database with the integration (··· → Connections)
- [ ] Add `NOTION_API_KEY` and `NOTION_DATABASE_ID` as repository secrets
- [ ] Repo Settings → Actions → General → Workflow permissions → **Read and write permissions**
- [ ] Trigger first manual sync to verify

---

## Troubleshooting

**Post not appearing after sync**
- Status must be `Published` in Notion
- Title, Slug, and Published Date are all required — check all three are filled in
- Check the Action log: repo → Actions → Notion Sync → latest run
- Check Pages build: repo → Settings → Pages

**Sync fails: 401 Unauthorized**
- Notion token wrong or expired → regenerate at notion.so/my-integrations → update secret
- Integration not connected to DB → Notion → ··· → Connections → add integration

**Sync fails: 403 on git push**
- Repo Settings → Actions → General → Workflow permissions → Read and write permissions

**Images broken on a blog post**
- This should no longer happen — the image pipeline downloads and saves all images locally during sync
- If it does: trigger a manual sync (the pipeline will re-download images with fresh Notion URLs)
- Check the Action log for warnings like "could not process image" — this means a download failed
- For featured images already using `raw.githubusercontent.com` URLs, verify the file exists in the repo

**Images broken on the homepage**
- Homepage images are manually managed in `resources/images/` — not part of the auto pipeline
- Check the file exists and the path in `index.html` is correct

**Fonts broken on post pages**
- Font paths in `styles.css` must be root-relative: `url('/fonts/...')` not `url('fonts/...')`

---

## SEO / structured data

Each post automatically gets (via `jekyll-seo-tag` + manual additions in `_layouts/post.html`):

- `<title>`, `og:title`, `og:description`, `og:image`, `og:url`
- `twitter:card: summary_large_image`
- Canonical URL, `article:published_time`, `article:tag`, `article:section`
- Full **JSON-LD BlogPosting schema** with `articleBody`
  — key for AI citation engines (Perplexity, ChatGPT, etc.)
- `TechArticle` co-type when Post Type = Guide

No per-post SEO config needed beyond filling in the Notion properties.

---

## Sync schedule

The Action runs at minute 0 of every even hour UTC: `0 */2 * * *`

Maximum delay from publishing in Notion to going live: ~2 hours.
Use the manual trigger for immediate publishing.
