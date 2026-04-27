import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['.git', '.jekyll-cache', '_site', 'node_modules']);
const assetExtensions = new Set([
  '.avif',
  '.css',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.mp4',
  '.png',
  '.svg',
  '.webm',
  '.webp',
  '.woff',
  '.woff2'
]);

function toRepoPath(filePath) {
  return normalize(relative(root, filePath)).split(sep).join('/');
}

function listFiles(dir, extensions) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...listFiles(fullPath, extensions));
    } else if (stats.isFile() && extensions.has(extname(entry).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function readJekyllExcludes() {
  const configPath = join(root, '_config.yml');
  if (!existsSync(configPath)) return [];

  const config = readFileSync(configPath, 'utf8');
  const inlineExclude = config.match(/^exclude:\s*\[(.*)\]\s*$/m);
  if (!inlineExclude) return [];

  return inlineExclude[1]
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
    .map((item) => normalize(item).split(sep).join('/'));
}

function isExternalOrDynamic(value) {
  return (
    !value ||
    value.startsWith('#') ||
    value.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.includes('{{') ||
    value.includes('{%')
  );
}

function stripUrlDecorators(value) {
  return value.split('#')[0].split('?')[0];
}

function getAssetCandidates(rawValue) {
  if (isExternalOrDynamic(rawValue)) return [];

  return rawValue.split(',').map((part) => {
    const [url] = part.trim().split(/\s+/);
    return stripUrlDecorators(url);
  }).filter(Boolean);
}

function resolveAssetPath(sourceFile, assetUrl) {
  const repoPath = assetUrl.startsWith('/')
    ? assetUrl.slice(1)
    : toRepoPath(resolve(dirname(sourceFile), assetUrl));

  const normalized = normalize(repoPath).split(sep).join('/');
  if (normalized.startsWith('..')) return null;
  if (!assetExtensions.has(extname(normalized).toLowerCase())) return null;

  return normalized;
}

function isExcluded(repoPath, excludes) {
  return excludes.some((excluded) => {
    const path = excluded.endsWith('/') ? excluded : `${excluded}/`;
    return repoPath === excluded.replace(/\/$/, '') || repoPath.startsWith(path);
  });
}

const excludes = readJekyllExcludes();
const problems = [];
const attrPattern = /\b(?:href|poster|src|srcset)=["']([^"']+)["']/gi;
const cssUrlPattern = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;

function checkReference(sourceFile, candidate) {
  const repoPath = resolveAssetPath(sourceFile, candidate);
  if (!repoPath) return;

  const sourceRepoPath = toRepoPath(sourceFile);
  if (!existsSync(join(root, repoPath))) {
    problems.push(`${sourceRepoPath} references missing asset ${candidate}`);
  } else if (isExcluded(repoPath, excludes)) {
    problems.push(`${sourceRepoPath} references Jekyll-excluded asset ${candidate}`);
  }
}

for (const htmlFile of listFiles(root, new Set(['.html']))) {
  const html = readFileSync(htmlFile, 'utf8');

  for (const match of html.matchAll(attrPattern)) {
    for (const candidate of getAssetCandidates(match[1])) {
      checkReference(htmlFile, candidate);
    }
  }
}

for (const cssFile of listFiles(root, new Set(['.css']))) {
  const css = readFileSync(cssFile, 'utf8');

  for (const match of css.matchAll(cssUrlPattern)) {
    for (const candidate of getAssetCandidates(match[1])) {
      checkReference(cssFile, candidate);
    }
  }
}

if (problems.length > 0) {
  console.error('Static asset check failed:');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log('Static asset check passed.');
