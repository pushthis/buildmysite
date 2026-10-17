import { fetchPins, escapeHtml, siteHref } from './site.js';

async function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    mapEl.innerHTML = '<p class="view-error">Map failed to load. Check your network or ad blocker.</p>';
    return;
  }

  const map = L.map('map').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 100);

  try {
    const pins = await fetchPins();

    if (pins.length === 0) return;

    const bounds = [];
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng]).addTo(map);
      marker.bindPopup(
        `<a href="${siteHref(`view.html?c=${encodeURIComponent(pin.slug)}`)}">${escapeHtml(pin.name)}</a>`
      );
      bounds.push([pin.lat, pin.lng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 6);
    }
  } catch {
    // Map still renders without pins
  }
}

initMap();
