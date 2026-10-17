import { DATA_BASE, fetchIndex, siteHref } from './site.js';

const PAGE_SIZE = 24;

let allEntries = [];
let currentPage = 0;

async function initExplore() {
  const grid = document.getElementById('explore-grid');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  if (!grid) return;

  try {
    allEntries = await fetchIndex();
  } catch {
    grid.innerHTML = '<p class="view-error">Could not load contributions.</p>';
    return;
  }

  function renderPage() {
    const totalPages = Math.max(1, Math.ceil(allEntries.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages - 1);

    const start = currentPage * PAGE_SIZE;
    const slice = allEntries.slice(start, start + PAGE_SIZE);

    grid.innerHTML = '';

    if (slice.length === 0) {
      grid.innerHTML = '<p>No contributions yet. Be the first!</p>';
    } else {
      for (const entry of slice) {
        const tile = document.createElement('a');
        tile.className = 'explore-tile';
        tile.href = siteHref(`view.html?c=${encodeURIComponent(entry.slug)}`);

        const label = document.createElement('div');
        label.className = 'explore-tile-label';
        label.textContent = entry.name;

        const iframe = document.createElement('iframe');
        iframe.sandbox = '';
        iframe.src = `${DATA_BASE}/contributions/${encodeURIComponent(entry.slug)}/page.html`;
        iframe.title = `Preview of ${entry.name}'s contribution`;
        iframe.loading = 'lazy';

        tile.appendChild(label);
        tile.appendChild(iframe);
        grid.appendChild(tile);
      }
    }

    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages} (${allEntries.length} total)`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(allEntries.length / PAGE_SIZE);
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  renderPage();
}

initExplore();
