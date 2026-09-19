import { DATA_BASE, escapeHtml, fetchIndex } from './site.js';

function getSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('c');
}

async function initView() {
  const container = document.getElementById('view-content');
  const slug = getSlug();

  if (!slug) {
    container.innerHTML = '<p class="view-error">No contribution specified.</p>';
    return;
  }

  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug)) {
    container.innerHTML = '<p class="view-error">Invalid contribution name.</p>';
    return;
  }

  try {
    const index = await fetchIndex();
    const entry = index.find((e) => e.slug === slug);

    if (!entry) {
      container.innerHTML = '<p class="view-error">Contribution not found.</p>';
      return;
    }

    document.title = `${entry.name} — Build My Site`;

    container.innerHTML = `
      <div class="view-frame-wrap">
        <iframe
          sandbox=""
          src="${DATA_BASE}/contributions/${encodeURIComponent(slug)}/page.html"
          title="Contribution by ${escapeHtml(entry.name)}"
        ></iframe>
      </div>
    `;
  } catch {
    container.innerHTML = '<p class="view-error">Could not load this contribution.</p>';
  }
}

initView();
