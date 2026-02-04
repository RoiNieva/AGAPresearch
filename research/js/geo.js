
import { byId } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";

export function getGPSPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function geoErrorText(err) {
  // GeolocationPositionError: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
  const code = err?.code;
  if (code === 1) return "Location permission denied.";
  if (code === 2) return "Location unavailable.";
  if (code === 3) return "Location request timed out.";
  return "Could not get location.";
}

export async function setClientNearMe() {
  const status = byId("near-status");
  if (status) status.textContent = "Getting your location…";

  try {
    const c = await getGPSPosition();

    const latEl = byId("client-lat");
    const lngEl = byId("client-lng");

    if (latEl) latEl.value = String(c.latitude);
    if (lngEl) lngEl.value = String(c.longitude);

    if (status) status.textContent = `Location set: ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
  } catch (err) {
    if (status) status.textContent = geoErrorText(err);
  }
}

export async function useMyLocation() {
  const status = byId("location-status");
  if (status) status.textContent = "Getting your location…";

  try {
    const c = await getGPSPosition();

    const latEl = byId("booking-lat");
    const lngEl = byId("booking-lng");

    if (latEl) latEl.value = String(c.latitude);
    if (lngEl) lngEl.value = String(c.longitude);

    if (status) status.textContent = `Pinned: ${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`;
  } catch (err) {
    if (status) status.textContent = geoErrorText(err);
  }
}

export async function setProviderLocation() {
  const sess = getSession();
  if (!sess || sess.role !== "provider") return alert("Provider login required.");

  const p = state.providers.find(x => x.id === sess.id);
  if (!p) return alert("Provider not found.");

  const status = byId("pro-location-status");
  if (status) status.textContent = "Getting your location…";

  try {
    const c = await getGPSPosition();
    p.location = { lat: c.latitude, lng: c.longitude };
    saveArray(K.providers, state.providers);

    if (status) status.textContent = `Saved: ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
  } catch (err) {
    if (status) status.textContent = geoErrorText(err);
  }
}
