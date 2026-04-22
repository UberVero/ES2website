/**
 * download-case-study-images.js
 * One-time script to download and optimize images from expiring Notion URLs
 * into a case study folder under results/.
 *
 * Usage: node scripts/download-case-study-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 82;

async function downloadImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function optimizeImage(buffer, keepAsGif = false) {
  if (keepAsGif) return { buffer, ext: 'gif' };
  const image = sharp(buffer);
  const meta = await image.metadata();
  let pipeline = image;
  if (meta.width && meta.width > MAX_WIDTH) pipeline = pipeline.resize(MAX_WIDTH);
  const webp = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  return { buffer: webp, ext: 'webp' };
}

const IMAGES = [
  {
    name: 'filters',
    url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/e1c2efbf-ecd2-4450-91b9-a6f818ef34bf/db6ae70c-c9be-46ee-a38e-b0956e1f661f/Scalapay_2021_filters.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WWJA7SWQ%2F20260422%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260422T175042Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEIb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCGM3HpRYBQqIK0FlkX61GzcTvz7mp2yLCK08VpSUEXNAIgEnvmYzrn3bbB6N4NZcOVLdCpUelsJYWgjeqgWMpHco8q%2FwMITxAAGgw2Mzc0MjMxODM4MDUiDLVmeSMNi9vjJR4GsyrcA5G8PiV%2F4zCLlArlKaOcuaSYKdxFetgCJH4ag9qfRCqwTdS8H93U1GTj066ZL6%2BUfFzVz%2BVVN0messnlO2t7bIuaXmax3nM6eqQ7toUczl3mVbYWiCtvqKMB6Z3meRcfU8CJYQOWMsQ%2FtlufvE0Yr35mUYebupFqVdOWIjaZ8ue2oYmsgsDDDTg8B2teKpuO3psyrppjtrJUyTApN7IISjM%2Byh0ieKKoO5Sca3qnouJVbXPXR8F4Xny6%2Fh7k7M6LJRbVotoDso2OOf%2FWBvATv7xlU5yi7tPJePjhGGfCHSuay2Vq9LfZAvzOUdDuaCC4pz%2FZsXwSai9CmmHtuJUMoMg1Dv0YESDoKbsjlYd5fT%2B9SCIvRkzmnA%2BlLfbN3Km71QxYh7JC9iEuLfWl7vwI9v3d9XgNfpNCx7FX2u9JUUKFot%2FCaeOmxahvig5riSoAomT2gSdJcmsT9zq92J7%2F7lubbCFFPBmitKIFQSaTK0RfHZpX8YvCw0lbDODPNfmQM3cJyE%2FoAUePMbvVresoZCw9ca%2FP2ny31TyynNP8VPi6HWrmg2RcJXKjRdTWYUw21dmacWKnbfXsg99qcqZYwyTReAhb3qAzEBDezkkxdL1UTmrFIOhzVujeNbFlMJilo88GOqUB%2FF0AAqfHas0xd%2F5PzWJTZN4%2FyWQ0nb07w1ojMCO7xS%2BmAGu1%2BVIitQVyiyMZ%2Begft%2BpJcLx%2BtT1KX94oUSVAnZrIaXhqJjrnblkaEcS%2FL%2FTtZ8qhYQK%2ByN7MhpClTmI1Ag6QVV0ZDECwk4Gk8YfKD8WB5I48wGBtZ5cdNvHY8aVQvm943LySH%2F1tWweijloTeYXUzVjFoalQ%2BKFdK475scRAjwVl&X-Amz-Signature=dbfef3b665dafefec24120071bd168c03b1de6c1326ddfe5eaf4c7e7b7f18403&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject',
    gif: false,
  },
  {
    name: 'algolia-search',
    url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/e1c2efbf-ecd2-4450-91b9-a6f818ef34bf/5c69e67f-cdd6-4419-a12d-917020cb3f72/scalapay-gif.gif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WWJA7SWQ%2F20260422%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260422T175042Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEIb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCGM3HpRYBQqIK0FlkX61GzcTvz7mp2yLCK08VpSUEXNAIgEnvmYzrn3bbB6N4NZcOVLdCpUelsJYWgjeqgWMpHco8q%2FwMITxAAGgw2Mzc0MjMxODM4MDUiDLVmeSMNi9vjJR4GsyrcA5G8PiV%2F4zCLlArlKaOcuaSYKdxFetgCJH4ag9qfRCqwTdS8H93U1GTj066ZL6%2BUfFzVz%2BVVN0messnlO2t7bIuaXmax3nM6eqQ7toUczl3mVbYWiCtvqKMB6Z3meRcfU8CJYQOWMsQ%2FtlufvE0Yr35mUYebupFqVdOWIjaZ8ue2oYmsgsDDDTg8B2teKpuO3psyrppjtrJUyTApN7IISjM%2Byh0ieKKoO5Sca3qnouJVbXPXR8F4Xny6%2Fh7k7M6LJRbVotoDso2OOf%2FWBvATv7xlU5yi7tPJePjhGGfCHSuay2Vq9LfZAvzOUdDuaCC4pz%2FZsXwSai9CmmHtuJUMoMg1Dv0YESDoKbsjlYd5fT%2B9SCIvRkzmnA%2BlLfbN3Km71QxYh7JC9iEuLfWl7vwI9v3d9XgNfpNCx7FX2u9JUUKFot%2FCaeOmxahvig5riSoAomT2gSdJcmsT9zq92J7%2F7lubbCFFPBmitKIFQSaTK0RfHZpX8YvCw0lbDODPNfmQM3cJyE%2FoAUePMbvVresoZCw9ca%2FP2ny31TyynNP8VPi6HWrmg2RcJXKjRdTWYUw21dmacWKnbfXsg99qcqZYwyTReAhb3qAzEBDezkkxdL1UTmrFIOhzVujeNbFlMJilo88GOqUB%2FF0AAqfHas0xd%2F5PzWJTZN4%2FyWQ0nb07w1ojMCO7xS%2BmAGu1%2BVIitQVyiyMZ%2Begft%2BpJcLx%2BtT1KX94oUSVAnZrIaXhqJjrnblkaEcS%2FL%2FTtZ8qhYQK%2ByN7MhpClTmI1Ag6QVV0ZDECwk4Gk8YfKD8WB5I48wGBtZ5cdNvHY8aVQvm943LySH%2F1tWweijloTeYXUzVjFoalQ%2BKFdK475scRAjwVl&X-Amz-Signature=ed3e9127be7782cc7792b7d985b4450923290c483ab540b20181b1f98acb1317&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject',
    gif: true,
  },
  {
    name: 'architecture',
    url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/e1c2efbf-ecd2-4450-91b9-a6f818ef34bf/0ebdc017-b0f4-42af-b1d3-1dd1f5b0fe77/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WWJA7SWQ%2F20260422%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260422T175042Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEIb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCGM3HpRYBQqIK0FlkX61GzcTvz7mp2yLCK08VpSUEXNAIgEnvmYzrn3bbB6N4NZcOVLdCpUelsJYWgjeqgWMpHco8q%2FwMITxAAGgw2Mzc0MjMxODM4MDUiDLVmeSMNi9vjJR4GsyrcA5G8PiV%2F4zCLlArlKaOcuaSYKdxFetgCJH4ag9qfRCqwTdS8H93U1GTj066ZL6%2BUfFzVz%2BVVN0messnlO2t7bIuaXmax3nM6eqQ7toUczl3mVbYWiCtvqKMB6Z3meRcfU8CJYQOWMsQ%2FtlufvE0Yr35mUYebupFqVdOWIjaZ8ue2oYmsgsDDDTg8B2teKpuO3psyrppjtrJUyTApN7IISjM%2Byh0ieKKoO5Sca3qnouJVbXPXR8F4Xny6%2Fh7k7M6LJRbVotoDso2OOf%2FWBvATv7xlU5yi7tPJePjhGGfCHSuay2Vq9LfZAvzOUdDuaCC4pz%2FZsXwSai9CmmHtuJUMoMg1Dv0YESDoKbsjlYd5fT%2B9SCIvRkzmnA%2BlLfbN3Km71QxYh7JC9iEuLfWl7vwI9v3d9XgNfpNCx7FX2u9JUUKFot%2FCaeOmxahvig5riSoAomT2gSdJcmsT9zq92J7%2F7lubbCFFPBmitKIFQSaTK0RfHZpX8YvCw0lbDODPNfmQM3cJyE%2FoAUePMbvVresoZCw9ca%2FP2ny31TyynNP8VPi6HWrmg2RcJXKjRdTWYUw21dmacWKnbfXsg99qcqZYwyTReAhb3qAzEBDezkkxdL1UTmrFIOhzVujeNbFlMJilo88GOqUB%2FF0AAqfHas0xd%2F5PzWJTZN4%2FyWQ0nb07w1ojMCO7xS%2BmAGu1%2BVIitQVyiyMZ%2Begft%2BpJcLx%2BtT1KX94oUSVAnZrIaXhqJjrnblkaEcS%2FL%2FTtZ8qhYQK%2ByN7MhpClTmI1Ag6QVV0ZDECwk4Gk8YfKD8WB5I48wGBtZ5cdNvHY8aVQvm943LySH%2F1tWweijloTeYXUzVjFoalQ%2BKFdK475scRAjwVl&X-Amz-Signature=ee48d202ad7aa350f7601af488cbef3a3a177bd33f696cf3eb93f0c0f719fa6a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject',
    gif: false,
  },
];

const OUT_DIR = path.join(__dirname, '..', 'results', 'scalapay-webflow-directory-headless-cms');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const img of IMAGES) {
    console.log(`Downloading ${img.name}...`);
    const raw = await downloadImage(img.url);
    const { buffer, ext } = await optimizeImage(raw, img.gif);
    const outPath = path.join(OUT_DIR, `${img.name}.${ext}`);
    fs.writeFileSync(outPath, buffer);
    const kb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  Saved ${outPath} (${kb} KB)`);
  }
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
