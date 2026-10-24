export function sitePath(relativePath) {
  return new URL(relativePath, document.baseURI).pathname;
}

export function siteHref(relativePath) {
  const url = new URL(relativePath, document.baseURI);
  return url.pathname + url.search + url.hash;
}

export const DATA_BASE = sitePath('dist');

async function fetchJson(path) {
  const url = `${DATA_BASE}/${path}?_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export async function fetchIndex() {
  return fetchJson('index.json');
}

export async function fetchPins() {
  return fetchJson('pins.json');
}

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
