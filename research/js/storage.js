export const K = {
  providers: "agap_providers_v3",
  clients: "agap_clients_v3",
  session: "agap_session_v3",
  bookings: "agap_bookings_v3",
  reviews: "agap_reviews_v3",
  blocks: "agap_blocks_v2",
  reports: "agap_reports_v2",
  availability: "agap_availability_v1",
  chats: "agap_chats_v1",
  verifyRequests: "agap_verify_requests_v1",
  theme: "agap_theme_v1"
};

export function loadArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(K.session)); }
  catch { return null; }
}

export function setSession(sess) {
  localStorage.setItem(K.session, JSON.stringify(sess));
}
