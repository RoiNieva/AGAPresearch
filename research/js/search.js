// js/search.js
import { byId, val } from "./dom.js";
import { state, SERVICE_CATALOG } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { escapeHTML, formatDate } from "./utils.js";
import { haversineKm } from "./geo.js";
import { applyStagger } from "./motion.js";

// ✅ Trust signal: rating text helper
import { providerAvgText } from "./reviews.js";

/* ---------------------------
   UI Init
---------------------------- */
export function initAdvancedFiltersToggle() {
  const btn = byId("toggle-advanced");
  const panel = byId("advanced-filters");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const hidden = panel.classList.toggle("hidden");
    btn.textContent = hidden ? "Advanced Filters ▾" : "Advanced Filters ▴";
  });
}

/**
 * Populate dropdowns for Client search filters:
 *  - #client-category
 *  - #client-service (dependent on selected category)
 */
export function initClientSearchFilters() {
  const catSel = byId("client-category");
  const svcSel = byId("client-service");
  if (!catSel || !svcSel) return;

  const categories = Object.keys(SERVICE_CATALOG || {});
  catSel.innerHTML =
    `<option value="">All categories</option>` +
    categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");

  svcSel.innerHTML = `<option value="">All services</option>`;

  catSel.addEventListener("change", () => {
    const cat = catSel.value;
    const services = cat ? (SERVICE_CATALOG[cat] || []) : [];

    svcSel.innerHTML =
      `<option value="">All services</option>` +
      services.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
  });
}

/* ---------------------------
   Helpers
---------------------------- */
function isBlocked(providerId) {
  const sess = getSession();
  if (!sess) return false;
  return state.blocks.some(b => b.blockerId === sess.id && b.targetProviderId === providerId);
}

function providerMatchesFilters(p, filters) {
  if (!p) return false;
  if (isBlocked(p.id)) return false;

  const prof = p.profile || {};
  const providerServices = Array.isArray(p.services) ? p.services : [];

  const cityOk =
    !filters.city ||
    String(prof.city || "").toLowerCase().includes(filters.city);

  if (!cityOk) return false;

  if (filters.useNearMe) {
    if (!p.location?.lat || !p.location?.lng) return false;
    const d = haversineKm(filters.clientLat, filters.clientLng, p.location.lat, p.location.lng);
    if (d > filters.nearRadius) return false;
  }

  const keyword = filters.keyword;

  const anyServiceMatch = providerServices.some(s => {
    const sCat = String(s?.category || "");
    const sSvc = String(s?.service || "");

    const catOk = !filters.category || sCat === filters.category;
    const svcOk = !filters.service || sSvc === filters.service;

    const keyOk =
      !keyword ||
      String(prof.name || "").toLowerCase().includes(keyword) ||
      sCat.toLowerCase().includes(keyword) ||
      sSvc.toLowerCase().includes(keyword);

    return catOk && svcOk && keyOk;
  });

  if (providerServices.length === 0) {
    const nameOk = !keyword || String(prof.name || "").toLowerCase().includes(keyword);
    return nameOk && (!filters.category && !filters.service);
  }

  return anyServiceMatch;
}

function createProviderCard(p) {
  const card = document.createElement("div");
  card.className = "card result-card";

  const prof = p.profile || {};
  const isVerified = !!p.verified;

  // ⭐ rating text from reviews
  const ratingText = providerAvgText(p.id);

  const servicesPreview = (p.services || [])
    .map(s => `${s.category} - ${s.service}`)
    .slice(0, 3)
    .map(x => escapeHTML(x));

  card.innerHTML = `
    <div class="result-top">
      <h3 class="result-name">${escapeHTML(prof.name || "Provider")}</h3>

      <div class="trust-row">
        ${isVerified
          ? `<span class="trust-badge verified">✅ Verified</span>`
          : `<span class="trust-badge unverified">Not verified</span>`}
        <span class="trust-badge rating">⭐ ${escapeHTML(ratingText)}</span>
      </div>
    </div>

    <p class="result-meta">
      📍 ${escapeHTML(prof.city || "")}
      • 📅 ${escapeHTML(formatDate(prof.date))}
      • ⏰ ${escapeHTML(prof.time || "")}
    </p>

    ${servicesPreview.length
      ? `<p class="muted tiny">Services: ${servicesPreview.join(", ")}${(p.services || []).length > 3 ? "..." : ""}</p>`
      : ""}

    <div class="actions">
      <button class="primary-btn" data-book-provider="${escapeHTML(p.id)}">Book this Pro</button>
      <div class="action-row">
        <button class="action-btn" data-action="openReportModal" data-provider="${escapeHTML(p.id)}">🚩 Report/Block</button>
      </div>
    </div>
  `;
  return card;
}

/* ---------------------------
   No-result explanations
---------------------------- */
function buildNoResultsCard(stats) {
  const tips = [];

  if (stats.totalProviders === 0) {
    tips.push("No providers are registered yet.");
  } else {
    if (stats.blockedCount > 0) tips.push(`${stats.blockedCount} provider(s) are blocked by you.`);

    if (stats.useNearMe) {
      if (stats.noGpsCount > 0) tips.push(`${stats.noGpsCount} provider(s) have no GPS location set (ask them to enable GPS in Profile).`);
      if (stats.outsideRadiusCount > 0) tips.push(`${stats.outsideRadiusCount} provider(s) are outside your radius.`);
      tips.push("Try increasing the radius or turn off Near Me.");
    }

    if (stats.cityFilteredCount > 0) tips.push(`${stats.cityFilteredCount} provider(s) were filtered by city. Try clearing the city filter.`);
    if (stats.serviceFilteredCount > 0) tips.push("No provider matched your category/service/keyword filters. Try clearing filters or using a broader keyword.");

    // helpful generic fallback
    if (tips.length === 0) tips.push("Try removing filters or searching a different keyword.");
  }

  return `
    <div class="card soft">
      <h3>No matching providers found</h3>
      <p class="muted tiny">Here’s why it might be happening:</p>
      <ul class="muted tiny" style="margin-top:8px; padding-left:18px;">
        ${tips.map(t => `<li>${escapeHTML(t)}</li>`).join("")}
      </ul>
    </div>
  `;
}

/* ---------------------------
   Search (Main)
---------------------------- */
export function searchService() {
  const out = byId("results-list");
  if (!out) return;

  out.innerHTML = "";

  const keyword = val("search-input").toLowerCase();
  const city = val("city-filter").toLowerCase();
  const category = byId("client-category")?.value || "";
  const service = byId("client-service")?.value || "";

  const clientLat = Number(byId("client-lat")?.value || 0);
  const clientLng = Number(byId("client-lng")?.value || 0);
  const nearRadius = Number(byId("near-radius")?.value || 0);
  const useNearMe = !!clientLat && !!clientLng && nearRadius > 0;

  const filters = {
    keyword,
    city,
    category,
    service,
    useNearMe,
    clientLat,
    clientLng,
    nearRadius
  };

  // stats for explanations
  const stats = {
    totalProviders: (state.providers || []).length,
    blockedCount: 0,
    useNearMe,
    noGpsCount: 0,
    outsideRadiusCount: 0,
    cityFilteredCount: 0,
    serviceFilteredCount: 0
  };

  const matches = (state.providers || []).filter(p => {
    if (!p) return false;

    if (isBlocked(p.id)) {
      stats.blockedCount++;
      return false;
    }

    const prof = p.profile || {};
    const providerServices = Array.isArray(p.services) ? p.services : [];

    // city filter
    const cityOk = !filters.city || String(prof.city || "").toLowerCase().includes(filters.city);
    if (!cityOk) {
      stats.cityFilteredCount++;
      return false;
    }

    // near-me filter
    if (filters.useNearMe) {
      if (!p.location?.lat || !p.location?.lng) {
        stats.noGpsCount++;
        return false;
      }
      const d = haversineKm(filters.clientLat, filters.clientLng, p.location.lat, p.location.lng);
      if (d > filters.nearRadius) {
        stats.outsideRadiusCount++;
        return false;
      }
    }

    // service filters
    const ok = providerServices.some(s => {
      const sCat = String(s?.category || "");
      const sSvc = String(s?.service || "");
      const catOk = !filters.category || sCat === filters.category;
      const svcOk = !filters.service || sSvc === filters.service;

      const keyOk =
        !filters.keyword ||
        String(prof.name || "").toLowerCase().includes(filters.keyword) ||
        sCat.toLowerCase().includes(filters.keyword) ||
        sSvc.toLowerCase().includes(filters.keyword);

      return catOk && svcOk && keyOk;
    });

    if (!ok) stats.serviceFilteredCount++;
    return ok;
  });

  if (!matches.length) {
    out.innerHTML = buildNoResultsCard(stats);
    return;
  }

  matches.forEach(p => out.appendChild(createProviderCard(p)));
  applyStagger?.(out, 60);
}

/* ---------------------------
   Categories page
---------------------------- */
export function buildCategoryGrid() {
  const grid = byId("category-grid");
  if (!grid) return;

  grid.innerHTML = "";

  Object.keys(SERVICE_CATALOG).forEach(cat => {
    const div = document.createElement("div");
    div.className = "category-card";
    div.innerHTML = `
      <h3>${escapeHTML(cat)}</h3>
      <p class="muted">${SERVICE_CATALOG[cat].length} services</p>
      <button class="primary-btn" data-category="${escapeHTML(cat)}">View Providers</button>
    `;
    grid.appendChild(div);
  });

  applyStagger?.(grid, 50);
}

export function selectCategory(category) {
  const title = byId("category-selected-title");
  const wrap = byId("category-selected-results");
  if (!title || !wrap) return;

  title.textContent = category;
  wrap.innerHTML = "";

  const matches = state.providers.filter(p => (p.services || []).some(s => s.category === category));
  if (!matches.length) {
    wrap.innerHTML = `<p class="muted">No providers yet.</p>`;
    return;
  }

  matches.forEach(p => wrap.appendChild(createProviderCard(p)));
  applyStagger?.(wrap, 60);
}

/* ---------------------------
   Report / Block modal
---------------------------- */
export function openReportModal(providerId) {
  state.reportTargetProviderId = providerId;
  byId("reportModal")?.classList.remove("hidden");
}

export function closeReportModal() {
  state.reportTargetProviderId = null;
  byId("reportModal")?.classList.add("hidden");
}

export function submitReport() {
  const sess = getSession();
  if (!sess) return alert("Sign in first.");
  if (!state.reportTargetProviderId) return;

  state.reports.push({
    id: "r_" + Date.now(),
    reporterId: sess.id,
    targetProviderId: state.reportTargetProviderId,
    reason: byId("reportReason")?.value || "Other",
    details: (byId("reportDetails")?.value || "").trim(),
    createdAt: Date.now()
  });

  saveArray(K.reports, state.reports);
  alert("Report submitted.");
  closeReportModal();
}

export function blockTarget() {
  const sess = getSession();
  if (!sess) return alert("Sign in first.");
  if (!state.reportTargetProviderId) return;

  state.blocks.push({
    id: "b_" + Date.now(),
    blockerId: sess.id,
    targetProviderId: state.reportTargetProviderId,
    createdAt: Date.now()
  });

  saveArray(K.blocks, state.blocks);

  alert("Blocked.");
  closeReportModal();
  searchService();
}
