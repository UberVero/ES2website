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
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', '_posts');
const IMAGES_DIR = path.join(__dirname, '..', 'resources', 'images', 'blog');
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;

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
      const notionId = stripWrappingQuotes(match[1].trim());
      if (notionId) {
        map[notionId] = file;
      }
    }
  }
  return map;
}

function escapeYamlString(str) {
  if (!str) return '""';
  // Use double-quoted YAML string, escaping inner double quotes and backslashes
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function stripWrappingQuotes(str) {
  if (!str) return str;
  return str.replace(/^['"]|['"]$/g, '');
}

function isTemporarySignedImageUrl(url) {
  if (!url) return false;

  return (
    url.includes('X-Amz-Credential=') ||
    url.includes('X-Amz-Security-Token=') ||
    url.includes('X-Amz-Signature=') ||
    url.includes('prod-files-secure.s3.') ||
    url.includes('amazonaws.com')
  );
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

// ── image pipeline ────────────────────────────────────────────────────────

/** Validate that a URL is safe to download (HTTPS only, not internal IP/reserved domains) */
function validateImageUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      throw new Error(`Invalid protocol: ${url.protocol}. Only HTTPS is allowed.`);
    }

    const hostname = url.hostname.toLowerCase();

    // Block internal/reserved IP ranges and localhost
    const reservedPatterns = [
      /^localhost$/,
      /^127\./,           // 127.0.0.0/8 (loopback)
      /^10\./,            // 10.0.0.0/8 (private)
      /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12 (private)
      /^192\.168\./,      // 192.168.0.0/16 (private)
      /^169\.254\./,      // 169.254.0.0/16 (link-local)
      /^::1$/,            // IPv6 loopback
      /^fc00:/,           // IPv6 private
      /^fe80:/,           // IPv6 link-local
    ];

    if (reservedPatterns.some(pattern => pattern.test(hostname))) {
      throw new Error(`Blocked internal/reserved hostname: ${hostname}`);
    }

    return url;
  } catch (err) {
    throw new Error(`Invalid image URL: ${err.message}`);
  }
}

/** Download an image from a URL and return the buffer */
async function downloadImage(url) {
  // Validate URL before fetching
  validateImageUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30-second timeout

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB limit

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${url}`);

    // Check Content-Length header if available
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      throw new Error(`Image too large: ${contentLength} bytes exceeds ${MAX_SIZE} byte limit`);
    }

    // Read response with size limit enforcement
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      throw new Error(`Image too large: ${buffer.byteLength} bytes exceeds ${MAX_SIZE} byte limit`);
    }

    return Buffer.from(buffer);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(`Image download timeout: ${url}`);
    }
    throw err;
  }
}

/** Optimize an image buffer: resize to max width, convert to WebP */
async function optimizeImage(buffer) {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image;
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH);
  }

  // Animated GIFs: keep as-is (sharp WebP doesn't support animation well)
  if (metadata.format === 'gif' && metadata.pages && metadata.pages > 1) {
    return { buffer: buffer, ext: 'gif' };
  }

  const webpBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  return { buffer: webpBuffer, ext: 'webp' };
}

/**
 * Download, optimize, and save an image locally.
 * Returns the relative path from the repo root for use in markdown.
 */
async function processImage(url, slug, index) {
  const slugDir = path.join(IMAGES_DIR, slug);
  fs.mkdirSync(slugDir, { recursive: true });

  try {
    const rawBuffer = await downloadImage(url);
    const { buffer: optimized, ext } = await optimizeImage(rawBuffer);
    const filename = `img-${index}.${ext}`;
    const localPath = path.join(slugDir, filename);
    fs.writeFileSync(localPath, optimized);

    // Return path relative to repo root (for markdown/front matter)
    return `/resources/images/blog/${slug}/${filename}`;
  } catch (err) {
    console.warn(`  Warning: could not process image ${index}: ${err.message}`);
    return null;
  }
}

/**
 * Scan markdown body for image references, download and optimize each one,
 * and rewrite the markdown to point to local files.
 */
async function processBodyImages(markdown, slug) {
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];
  if (matches.length === 0) return markdown;

  let result = markdown;
  let index = 0;

  for (const match of matches) {
    const [fullMatch, altText, imageUrl] = match;
    index++;
    console.log(`    Processing inline image ${index}/${matches.length}...`);
    const localPath = await processImage(imageUrl, slug, index);
    if (localPath) {
      result = result.replace(fullMatch, `![${altText}](${localPath})`);
    } else if (isTemporarySignedImageUrl(imageUrl)) {
      throw new Error(
        `Could not localize temporary signed inline image ${index} for "${slug}". ` +
        'Sync aborted to avoid committing an expiring Notion/AWS URL.'
      );
    }
  }

  return result;
}

/**
 * Download and optimize a featured image from Notion.
 * Returns the local path for use in front matter.
 */
async function processFeaturedImage(imageUrl, slug) {
  if (!imageUrl) return null;

  // Skip images already hosted in the repo (raw.githubusercontent.com)
  if (imageUrl.includes('raw.githubusercontent.com') && imageUrl.includes('ES2website')) {
    return imageUrl;
  }

  console.log(`    Processing featured image...`);
  const localPath = await processImage(imageUrl, slug, 'featured');
  if (localPath) return localPath;

  if (isTemporarySignedImageUrl(imageUrl)) {
    throw new Error(
      `Could not localize temporary signed featured image for "${slug}". ` +
      'Sync aborted to avoid committing an expiring Notion/AWS URL.'
    );
  }

  return imageUrl;
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

    // Skip Case Studies — they are hand-built static HTML pages under /results/,
    // not Jekyll blog posts. They stay in the Notion "Eldur Blog" DB so content
    // can be drafted in the same place, but they don't sync to _posts/.
    const rawPostType = getSelectValue(props['Post Type']) || '';
    if (rawPostType.toLowerCase() === 'case study') {
      console.log(`  Skipping Case Study "${title}" — hand-built at /results/`);
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

    // Image pipeline: download, optimize, and rewrite image references
    console.log(`  Processing images for "${title}"...`);
    bodyMarkdown = await processBodyImages(bodyMarkdown, slug);
    const localImage = await processFeaturedImage(image, slug);

    // Fallback: if no explicit Featured Image URL, use the first inline image
    // in the body (already downloaded and rewritten to a local path above)
    let featuredImage = localImage;
    if (!featuredImage) {
      const firstInlineImage = bodyMarkdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (firstInlineImage) {
        featuredImage = firstInlineImage[1];
        console.log(`    No featured image set — using first body image: ${featuredImage}`);
      }
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
      image: featuredImage,
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
