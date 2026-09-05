import { fetchIndex } from './site.js';

async function fetchIndexSafe() {
  try {
    return await fetchIndex();
  } catch {
    return [];
  }
}

async function initMarquee() {
  const el = document.getElementById('marquee-content');
  if (!el) return;

  const index = await fetchIndexSafe();
  const count = index.length;
  const last = index.length > 0
    ? index.reduce((a, b) => (a.addedAt > b.addedAt ? a : b))
    : null;
  const lastLabel = last
    ? `${last.name}${last.location ? ` (${last.location})` : ''}`
    : 'none yet';

  const text = [
    `Contributions: ${count}`,
    `Latest: ${lastLabel}`,
  ].join('   •   ');

  el.innerHTML = `<span>${text}</span><span aria-hidden="true">${text}</span>`;
}

initMarquee();
