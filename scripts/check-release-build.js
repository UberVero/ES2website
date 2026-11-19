import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

const site = resolve(process.argv[2] || '_site');
assert(existsSync(join(site, 'index.html')), `Build the Jekyll site first: ${site}/index.html is missing.`);
for (const path of ['docs', '.agents', '.claude', '.github', 'tests', 'scripts', 'playwright.config.js', 'playwright.release.config.js']) {
  assert(!existsSync(join(site, path)), `Internal review or test material would be published: ${path}`);
}
const sitemap = readFileSync(join(site, 'sitemap.xml'), 'utf8');
assert(!sitemap.includes('/styleguide/'), 'The style guide must not appear in the sitemap.');
const portrait = join(site, 'assets/headshot-veronica.webp');
assert(existsSync(portrait), 'The optimized founder portrait is missing.');
assert(statSync(portrait).size < 120_000, 'The founder portrait must be smaller than 120 KB.');
const image = await sharp(portrait).metadata();
assert.equal(image.format, 'webp');
assert.equal(image.width, 640);
assert.equal(image.height, 640);
console.log('Release build passed: private material excluded, style guide omitted from sitemap, and 640px WebP portrait below 120 KB.');
