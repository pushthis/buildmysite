import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { geocodeAll } from './geocode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTRIBUTIONS_DIR = path.join(ROOT, 'contributions');
const DIST_DIR = path.join(ROOT, 'dist');

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

async function readContributions() {
  let entries;
  try {
    entries = await fs.readdir(CONTRIBUTIONS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const contributions = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    if (!SLUG_RE.test(slug)) {
      console.warn(`Skipping invalid slug folder: ${slug}`);
      continue;
    }

    const dir = path.join(CONTRIBUTIONS_DIR, slug);
    const metaPath = path.join(dir, 'meta.json');
    const pagePath = path.join(dir, 'page.html');

    try {
      await fs.access(metaPath);
      await fs.access(pagePath);
    } catch {
      console.warn(`Skipping incomplete contribution: ${slug}`);
      continue;
    }

    const metaRaw = await fs.readFile(metaPath, 'utf8');
    let meta;
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      console.warn(`Skipping ${slug}: invalid meta.json`);
      continue;
    }

    const stat = await fs.stat(dir);
    contributions.push({ slug, meta, dir, mtime: stat.mtimeMs });
  }

  return contributions;
}

async function copyContributionPages(contributions) {
  for (const { slug, dir } of contributions) {
    const src = path.join(dir, 'page.html');
    const destDir = path.join(DIST_DIR, 'contributions', slug);
    const dest = path.join(destDir, 'page.html');
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(src, dest);
  }
}

async function build() {
  const contributions = await readContributions();
  contributions.sort((a, b) => a.slug.localeCompare(b.slug));

  const locations = contributions
    .map((c) => c.meta.location)
    .filter(Boolean);

  const { cache, cacheChanged } = await geocodeAll(locations);

  const index = contributions.map(({ slug, meta, mtime }) => ({
    slug,
    name: meta.name || slug,
    location: meta.location || null,
    hasLocation: Boolean(meta.location),
    addedAt: new Date(mtime).toISOString(),
  }));

  index.sort((a, b) => a.slug.localeCompare(b.slug));

  const pins = [];
  for (const entry of index) {
    if (!entry.location) continue;
    const coords = cache[entry.location.trim()];
    if (!coords) continue;
    pins.push({
      slug: entry.slug,
      name: entry.name,
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  await fs.mkdir(DIST_DIR, { recursive: true });
  await copyContributionPages(contributions);

  await fs.writeFile(
    path.join(DIST_DIR, 'index.json'),
    JSON.stringify(index, null, 2) + '\n'
  );
  await fs.writeFile(
    path.join(DIST_DIR, 'pins.json'),
    JSON.stringify(pins, null, 2) + '\n'
  );

  console.log(`Built ${index.length} contribution(s), ${pins.length} map pin(s).`);
  if (cacheChanged) {
    console.log('Geocode cache updated.');
  }

  return { count: index.length, pins: pins.length, cacheChanged };
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
