import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_PATH = path.join(ROOT, 'data', 'geocode-cache.json');
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'buildmysite/1.0 (community github pages site)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveCache(cache) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

export async function geocodeLocation(location, cache) {
  const key = location.trim();
  if (!key) return null;

  if (cache[key]) {
    return cache[key];
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', key);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  await sleep(1100);

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    console.warn(`Geocoding failed for "${key}": HTTP ${res.status}`);
    return null;
  }

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) {
    console.warn(`Geocoding found no results for "${key}"`);
    return null;
  }

  const coords = {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  };

  cache[key] = coords;
  return coords;
}

export async function geocodeAll(locations) {
  const cache = await loadCache();
  const unique = [...new Set(locations.filter(Boolean).map((l) => l.trim()))];
  let cacheChanged = false;

  for (const location of unique) {
    if (cache[location]) continue;
    const before = JSON.stringify(cache);
    await geocodeLocation(location, cache);
    if (JSON.stringify(cache) !== before) {
      cacheChanged = true;
    }
  }

  if (cacheChanged) {
    await saveCache(cache);
  }

  return { cache, cacheChanged };
}
