/**
 * notion-sync.js
 * Syncs published posts from Notion "Eldur Blog" database to Jekyll _posts/
 *
 * Usage: node scripts/notion-sync.js
 * Env:   NOTION_API_KEY, NOTION_DATABASE_ID
 */

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', '_posts');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Silently skip unsupported block types
n2m.setCustomTransformer('unsupported', () => '');
n2m.setCustomTransformer('child_database', () => '');
n2m.setCustomTransformer('child_page', () => '');

// ── helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function richTextToPlain(richTextArr) {
  if (!richTextArr || !richTextArr.length) return '';
  return richTextArr.map(t => t.plain_text).join('');
}

function getSelectValue(prop) {
  return prop?.select?.name || null;
}

function getMultiSelectValues(prop) {
  return prop?.multi_select?.map(o => o.name) || [];
}

function getDateValue(prop) {
  return prop?.date?.start || null;
}

function getUrlValue(prop) {
  return prop?.url || null;
}

/** Scan existing _posts/*.md and build a map of notionId → filename */
function loadExistingPosts() {
  const map = {};
  if (!fs.existsSync(POSTS_DIR)) return map;
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const match = content.match(/^notion_id:\s*(.+)$/m);
    if (match) {
      map[match[1].trim()] = file;
    }
  }
  return map;
}

function escapeYamlString(str) {
  if (!str) return '""';
  // Use double-quoted YAML string, escaping inner double quotes and backslashes
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function buildFrontMatter(fields) {
  const lines = ['---'];
  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of val) {
        lines.push(`  - ${escapeYamlString(item)}`);
      }
    } else if (typeof val === 'boolean') {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${escapeYamlString(String(val))}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.NOTION_API_KEY) {
    console.error('Error: NOTION_API_KEY is not set');
    process.exit(1);
  }
  if (!process.env.NOTION_DATABASE_ID) {
    console.error('Error: NOTION_DATABASE_ID is not set');
    process.exit(1);
  }

  console.log('Querying Notion database...');

  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: 'Status',
      select: { equals: 'Published' },
    },
    sorts: [{ property: 'Published Date', direction: 'descending' }],
  });

  console.log(`Found ${response.results.length} published post(s).`);

  fs.mkdirSync(POSTS_DIR, { recursive: true });
  const existingPosts = loadExistingPosts();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const page of response.results) {
    const props = page.properties;

    // Required fields
    const title = richTextToPlain(props['Title']?.title);
    const slug = slugify(richTextToPlain(props['Slug']?.rich_text) || title);
    const publishedDate = getDateValue(props['Published Date']);

    if (!title || !slug || !publishedDate) {
      console.warn(`Skipping page ${page.id}: missing Title, Slug, or Published Date`);
      skipped++;
      continue;
    }

    // Optional fields
    const description = richTextToPlain(props['Description']?.rich_text) || null;
    const author = richTextToPlain(props['Author']?.rich_text) || null;
    const postType = getSelectValue(props['Post Type'])?.toLowerCase().replace(/\s+/g, '_') || null;
    const category = getSelectValue(props['Category']) || null;
    const tags = getMultiSelectValues(props['Tags']);
    const image = getUrlValue(props['Featured Image URL']) || null;
    const lastModified = getDateValue(props['Last Modified Date']) || null;

    // Build filename: YYYY-MM-DD-slug.md
    const filename = `${publishedDate}-${slug}.md`;
    const filepath = path.join(POSTS_DIR, filename);

    // Convert page body to markdown
    let bodyMarkdown = '';
    try {
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      bodyMarkdown = n2m.toMarkdownString(mdBlocks)?.parent || '';
    } catch (err) {
      console.warn(`Warning: could not convert body for "${title}": ${err.message}`);
    }

    // Build front matter
    const frontMatter = buildFrontMatter({
      title,
      slug,
      description,
      author,
      post_type: postType,
      category,
      tags: tags.length ? tags : null,
      image,
      date: publishedDate,
      last_modified_at: lastModified,
      status: 'published',
      notion_id: page.id,
      render_with_liquid: false,
    });

    const fileContent = `${frontMatter}\n\n${bodyMarkdown}\n`;

    // Determine if this is a create or update
    const existingFile = existingPosts[page.id];
    if (existingFile) {
      // If slug/date changed, remove old file
      const existingPath = path.join(POSTS_DIR, existingFile);
      if (existingFile !== filename && fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
      }
      fs.writeFileSync(filepath, fileContent, 'utf-8');
      console.log(`  Updated: ${filename}`);
      updated++;
    } else {
      fs.writeFileSync(filepath, fileContent, 'utf-8');
      console.log(`  Created: ${filename}`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
