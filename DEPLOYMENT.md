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
4. Add a **Featured Image URL** — paste a stable CDN URL (Cloudinary, Unsplash, etc.)
   - ⚠️ Do NOT upload images directly to Notion — those S3 URLs expire in ~1 hour
5. Set **Status → Published** when ready
6. Trigger a manual sync (see below) or wait up to 2 hours

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
| Post Type | Select | | Article, Guide, Case Study, Tutorial |
| Category | Select | | Guides, Case Studies, AI & Automation, Strategy |
| Tags | Multi-select | | AI Agents, B2B Marketing, One-Person Team, Strategy, Automation |
| Featured Image URL | URL | | Stable CDN URL only — Notion S3 URLs expire |
| Last Modified Date | Date | | Optional, for `dateModified` in schema.org |

---

## Updating a published post

Edit in Notion — any field. The next sync detects the change via `notion_id` in the Markdown
front matter and overwrites the file in place. No duplicate posts.

**If you change the Slug or Published Date:** the old file is deleted and a new one is created at
the new URL. The old URL will 404. Update any links before changing slugs on live posts.

---

## Unpublishing a post

Change **Status → Draft** in Notion. The sync will no longer update the post, but the existing
`_posts/` file stays live until you delete it from the repo manually.

---

## Key files

| File | Purpose |
|---|---|
| `scripts/notion-sync.js` | Queries Notion API, converts pages to Jekyll Markdown |
| `.github/workflows/notion-sync.yml` | GitHub Action: 2h schedule + manual trigger |
| `_config.yml` | Jekyll config: permalinks, plugins, excludes |
| `_layouts/post.html` | Post template with JSON-LD schema and og: tags |
| `resources/index.html` | Listing page at `/resources/` |
| `_posts/` | Auto-generated files — do not edit manually |
| `styles.css` | All styles including post prose and resource cards |

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

**Images broken**
- Notion S3 URLs expire — replace with a stable CDN URL in Featured Image URL

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
