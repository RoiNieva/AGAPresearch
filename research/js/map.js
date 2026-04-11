
import { loadGoogleMaps } from "./mapsLoader.js";
import { state } from "./state.js";
import { showToast, escapeHTML } from "./utils.js";
import { initScrollRevealMotion } from "./motion.js";
import { providerAvgText } from "./reviews.js";

let map = null;
let markers = [];

export async function initMapPage() {
  const el = document.getElementById("map");
  if (!el) return;

  const API_KEY = window.__GMAPS_KEY || "";

  try {
    const maps = await loadGoogleMaps(API_KEY);

    initScrollRevealMotion(document.getElementById("map-page"));

    if (!map) {
      map = new maps.Map(el, {
        center: { lat: 14.5995, lng: 120.9842 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
    }

    renderProviderMarkers();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          map.setZoom(13);
        },
        () => {}
      );
    }
  } catch (err) {
    console.error(err);
    showToast("Map failed to load. Check API key / restrictions.");
  }
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}

function renderProviderMarkers() {
  if (!map || !window.google?.maps) return;

  clearMarkers();

  (state.providers || []).forEach((provider) => {
    if (!provider.location?.lat || !provider.location?.lng) return;

    const name = provider.profile?.name || "Provider";
    const city = provider.profile?.city || "";
    const verified = !!provider.verified;
    const ratingText = providerAvgText(provider.id);

    const marker = new window.google.maps.Marker({
      map,
      position: { lat: provider.location.lat, lng: provider.location.lng },
      title: name,
      animation: window.google.maps.Animation.DROP
    });

    const infoHtml = `
      <div style="min-width:220px;">
        <div style="font-weight:700; margin-bottom:6px;">${escapeHTML(name)}</div>
        <div style="font-size:12px; opacity:.85; margin-bottom:6px;">📍 ${escapeHTML(city)}</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <span style="font-size:12px; padding:4px 8px; border-radius:999px; border:1px solid rgba(0,0,0,.12); background:rgba(0,0,0,.05);">
            ${verified ? "✅ Verified" : "Not verified"}
          </span>
          <span style="font-size:12px; padding:4px 8px; border-radius:999px; border:1px solid rgba(0,0,0,.12); background:rgba(0,0,0,.05);">
            ⭐ ${escapeHTML(ratingText)}
          </span>
        </div>
      </div>
    `;


    const info = new window.google.maps.InfoWindow({ content: `
    <div class="gm-info">
      <div class="gm-info-title">${provider.profile?.name || "Provider"}</div>
      <div class="gm-info-meta">📍 ${provider.profile?.city || ""}</div>
    </div>
  ` });

    marker.addListener("click", () => {
      info.open({ map, anchor: marker });

      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 650);
    });

    markers.push(marker);
  });
}
