export const BAD_WORDS = ["putangina","tanga","bobo","gago","ulol","punyeta","shit","fuck"];
export const REVIEW_FLAG_THRESHOLD = 1;
export const NEW_PROVIDER_DAYS = 7;
export const ACTIVE_PROVIDER_DAYS = 14;
export const BOOST_DAYS = 7;
export const BOOST_FIRST_BOOKINGS = 5;

export function withinDays(ts, days) {
  if (!ts) return false;
  return (Date.now() - ts) <= days * 86400000;
}

export function escapeHTML(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function escapeQuotes(str) {
  return String(str).replace(/'/g, "\\'");
}

export function makeId() {
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function showToast(msg, duration = 3000) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = String(msg || "");
  el.classList.remove("hidden");

  // restart animation if you have one
  el.classList.remove("toast-show");
  void el.offsetWidth;
  el.classList.add("toast-show");

  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(() => {
    el.classList.add("hidden");
  }, Number(duration) || 3000);
}





export function formatDate(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  try { return new Date(yyyyMmDd + "T00:00:00").toLocaleDateString(); }
  catch { return yyyyMmDd; }
}

export function containsProfanity(text) {
  const t = (text || "").toLowerCase();
  return BAD_WORDS.some(w => t.includes(w));
}

export function calcAverage(list) {
  if (!Array.isArray(list) || list.length === 0) return 0;
  const sum = list.reduce((a, r) => a + Number(r?.rating || 0), 0);
  return sum / list.length;
}

export function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
