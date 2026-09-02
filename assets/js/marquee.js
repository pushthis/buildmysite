const DATA_BASE = '/dist';
const GOATCOUNTER_TOTAL = 'https://terpinedream.goatcounter.com/counter/TOTAL.json';

async function fetchIndex() {
  const res = await fetch(`${DATA_BASE}/index.json`);
  if (!res.ok) return [];
  return res.json();
}

async function getVisitorCount() {
  try {
    const res = await fetch(GOATCOUNTER_TOTAL);
    if (!res.ok) return '—';
    const data = await res.json();
    // GoatCounter returns strings like "1,234"
    return data.count || data.count_unique || '—';
  } catch {
    return '—';
  }
}

async function initMarquee() {
  const el = document.getElementById('marquee-content');
  if (!el) return;

  const [index, visitors] = await Promise.all([fetchIndex(), getVisitorCount()]);
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
    `Visitors: ${visitors}`,
  ].join('   •   ');

  el.innerHTML = `<span>${text}</span><span aria-hidden="true">${text}</span>`;
}

initMarquee();
