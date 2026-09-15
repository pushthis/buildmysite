import { fetchIndex, siteHref } from './site.js';

function ensureRandomButton() {
  let btn = document.getElementById('random-page-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'random-page-btn';
    btn.type = 'button';
    btn.className = 'floating-button';
    btn.textContent = 'Random Page';
    document.body.appendChild(btn);
  }

  if (btn.dataset.bound) return;
  btn.dataset.bound = 'true';

  btn.addEventListener('click', async () => {
    try {
      const index = await fetchIndex();
      if (index.length === 0) {
        alert('No contributions yet!');
        return;
      }
      const entry = index[Math.floor(Math.random() * index.length)];
      window.location.href = siteHref(`view.html?c=${encodeURIComponent(entry.slug)}`);
    } catch {
      alert('Could not load contributions.');
    }
  });
}

ensureRandomButton();
