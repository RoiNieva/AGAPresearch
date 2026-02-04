import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray } from "./storage.js";
import { escapeHTML, calcAverage, containsProfanity, makeId } from "./utils.js";

export const REVIEW_FLAG_THRESHOLD = 1;

export function isReviewHidden(r) {
  return (r.flags || 0) >= REVIEW_FLAG_THRESHOLD;
}

export function providerAvgText(providerId) {
  const visible = state.reviews.filter(r => r.providerId === providerId && !isReviewHidden(r));
  const avg = calcAverage(visible);
  return avg ? `${avg.toFixed(1)} / 5` : "No reviews yet";
}

export function populateReviewProviders() {
  const sel = byId("review-provider");
  if (!sel) return;

  sel.innerHTML = "";

  if (state.providers.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No providers yet";
    sel.appendChild(opt);
    return;
  }

  state.providers.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.profile?.name || "Provider"} (${p.profile?.city || ""})`;
    sel.appendChild(opt);
  });
}

export function openReviewForProvider(providerId) {
  window.__routerShowPage?.("reviews-page");
  const sel = byId("review-provider");
  if (sel) sel.value = providerId;

  byId("review-text")?.focus();
}

export function submitReview() {
  const providerId = byId("review-provider")?.value || "";
  const rating = Number(byId("review-rating")?.value || 5);
  const name = val("review-name") || "Anonymous";
  const text = val("review-text");

  if (!providerId) return alert("Select a provider.");
  if (!text) return alert("Write a review.");
  if (containsProfanity(text)) return alert("Please remove profanity from your review.");

  const provider = state.providers.find(p => p.id === providerId);
  if (!provider) return alert("Provider not found.");

  state.reviews.push({
    id: makeId(),
    providerId,
    providerName: provider.profile?.name || "Provider",
    rating,
    name,
    text,
    flags: 0,
    createdAt: Date.now()
  });

  saveArray(K.reviews, state.reviews);
  renderReviewsList();

  const nameEl = byId("review-name");
  const textEl = byId("review-text");
  const ratingEl = byId("review-rating");

  if (nameEl) nameEl.value = "";
  if (textEl) textEl.value = "";
  if (ratingEl) ratingEl.value = "5";

  alert("Thanks! Review submitted.");
}

export function flagReview(reviewId) {
  const r = state.reviews.find(x => x.id === reviewId);
  if (!r) return;

  r.flags = (r.flags || 0) + 1;
  saveArray(K.reviews, state.reviews);
  renderReviewsList();
}

export function renderReviewsList() {
  const wrap = byId("reviews-list");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (state.reviews.length === 0) {
    wrap.innerHTML = `<p class="muted">No reviews yet.</p>`;
    return;
  }

  const sorted = state.reviews
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 20);

  let anyVisible = false;

  sorted.forEach(r => {
    if (isReviewHidden(r)) return;

    anyVisible = true;

    const item = document.createElement("div");
    item.className = "review-item";
    const date = new Date(r.createdAt).toLocaleString();

    item.innerHTML = `
      <div class="review-provider">${escapeHTML(r.providerName)}</div>
      <div class="review-meta">★ ${r.rating} • by ${escapeHTML(r.name)} • ${escapeHTML(date)}</div>
      <div class="review-text">${escapeHTML(r.text)}</div>
      <div class="action-row" style="margin-top:10px;">
        <button class="action-btn" type="button" data-flag-review="${escapeHTML(r.id)}">Flag</button>
      </div>
    `;

    wrap.appendChild(item);
  });

  if (!anyVisible) {
    wrap.innerHTML = `<p class="muted">No visible reviews (some may be hidden).</p>`;
  }
}

export function resetReviews() {
  if (!confirm("Reset reviews?")) return;
  state.reviews = [];
  saveArray(K.reviews, state.reviews);
  renderReviewsList();
  alert("Reviews reset.");
}


function installReviewDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-flag-review]");
    if (!el) return;

    const reviewId = el.dataset.flagReview;
    if (!reviewId) return;

    e.preventDefault();
    e.stopPropagation();
    flagReview(reviewId);
  }, true);
}

installReviewDelegation();
