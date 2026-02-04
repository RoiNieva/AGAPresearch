// js/providerDashboard.js
import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { escapeHTML, makeId, fileToDataUrl, calcAverage } from "./utils.js";
import { updateBell } from "./nav.js";
import { isReviewHidden } from "./reviews.js";
import { addNotification } from "./notifications.js";

let activeProviderTab = "bookings";

/* ---------------------------
  Helpers
---------------------------- */
function ensureGlobalHooks() {
  window.providerSetTab = providerSetTab;
}

function getProviderSession() {
  const sess = getSession();
  if (!sess || sess.role !== "provider") return null;
  return sess;
}

function getMeProvider() {
  const sess = getProviderSession();
  if (!sess) return null;
  return state.providers.find(p => p.id === sess.id) || null;
}

async function hashPassword(password) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = ((h << 5) + h) + password.charCodeAt(i);
  return "h_" + (h >>> 0).toString(16);
}

/* ---------------------------
  Time parsing for conflicts + earnings
---------------------------- */
function parseTimeToMinutes(t) {
  if (!t) return null;
  const s = String(t).trim().toLowerCase();

  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return hh * 60 + mm;
  }

  const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2] || 0);
    const ap = m12[3];

    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    if (ap === "pm" && hh !== 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;

    return hh * 60 + mm;
  }

  return null;
}

function parseTimeRange(rangeText) {
  const s = String(rangeText || "").trim().toLowerCase();
  if (!s.includes("-")) return null;

  const parts = s.split("-").map(x => x.trim());
  if (parts.length !== 2) return null;

  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);
  if (start == null || end == null) return null;
  if (end <= start) return null;

  return { start, end };
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function estimateHoursFromRange(rangeText) {
  const r = parseTimeRange(rangeText);
  if (!r) return null;
  return (r.end - r.start) / 60;
}

/* ---------------------------
  Stats helpers
---------------------------- */
function ensureStatsMount() {
  const tab = byId("provider-tab-bookings");
  if (!tab) return null;

  let mount = byId("provider-stats");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "provider-stats";
    mount.className = "provider-stats";
    tab.insertBefore(mount, tab.firstChild);
  }
  return mount;
}

function getProviderAvgRating(providerId) {
  const visible = state.reviews.filter(r => r.providerId === providerId && !isReviewHidden(r));
  const avg = calcAverage(visible);
  return avg || 0;
}

function computeProviderStats(me) {
  const myBookings = state.bookings.filter(b => b.providerId === me.id);

  const counts = {
    total: myBookings.length,
    Pending: 0,
    Accepted: 0,
    Ongoing: 0,
    Completed: 0,
    Closed: 0,
    Declined: 0,
    Cancelled: 0
  };

  myBookings.forEach(b => {
    const st = b.status || "Pending";
    if (counts[st] != null) counts[st] += 1;
  });

  const decisions = counts.Accepted + counts.Declined;
  const acceptanceRate = decisions > 0 ? (counts.Accepted / decisions) : 0;

  const completionBase = counts.Accepted + counts.Ongoing + counts.Completed + counts.Closed;
  const completionRate = completionBase > 0 ? (counts.Closed / completionBase) : 0;

  const pricingType = me.pricing?.type || "Fixed";
  const amount = Number(me.pricing?.amount || 0);

  let earnings = 0;
  const paidStatuses = new Set(["Completed", "Closed"]);
  myBookings.forEach(b => {
    if (!paidStatuses.has(b.status)) return;

    if (pricingType === "Hourly") {
      const hours = estimateHoursFromRange(b.time) ?? 1;
      earnings += amount * hours;
    } else {
      earnings += amount;
    }
  });

  const avgRating = getProviderAvgRating(me.id);

  return { counts, acceptanceRate, completionRate, avgRating, pricingType, amount, earnings };
}

function formatPct(x) {
  return `${Math.round((x || 0) * 100)}%`;
}

function formatPHP(x) {
  const n = Number(x || 0);
  return `PHP ${n.toFixed(0)}`;
}

function renderProviderStats() {
  const me = getMeProvider();
  const mount = ensureStatsMount();
  if (!mount) return;

  if (!me) {
    mount.innerHTML = "";
    return;
  }

  const s = computeProviderStats(me);
  const ratingText = s.avgRating ? `${s.avgRating.toFixed(1)} / 5` : "No reviews yet";

  mount.innerHTML = `
    <div class="stats-grid">
      <div class="stats-card"><div class="stats-label">Total bookings</div><div class="stats-value">${s.counts.total}</div><div class="stats-sub muted tiny">All time</div></div>
      <div class="stats-card"><div class="stats-label">Pending</div><div class="stats-value">${s.counts.Pending}</div><div class="stats-sub muted tiny">Needs action</div></div>
      <div class="stats-card"><div class="stats-label">Accepted</div><div class="stats-value">${s.counts.Accepted}</div><div class="stats-sub muted tiny">Approved jobs</div></div>
      <div class="stats-card"><div class="stats-label">Ongoing</div><div class="stats-value">${s.counts.Ongoing}</div><div class="stats-sub muted tiny">In progress</div></div>
      <div class="stats-card"><div class="stats-label">Completed</div><div class="stats-value">${s.counts.Completed}</div><div class="stats-sub muted tiny">Waiting client confirm</div></div>
      <div class="stats-card"><div class="stats-label">Closed</div><div class="stats-value">${s.counts.Closed}</div><div class="stats-sub muted tiny">Finished</div></div>
      <div class="stats-card"><div class="stats-label">Acceptance rate</div><div class="stats-value">${formatPct(s.acceptanceRate)}</div><div class="stats-sub muted tiny"></div></div>
      <div class="stats-card"><div class="stats-label">Completion rate</div><div class="stats-value">${formatPct(s.completionRate)}</div><div class="stats-sub muted tiny"></div></div>
      <div class="stats-card"><div class="stats-label">Avg rating</div><div class="stats-value">⭐ ${escapeHTML(ratingText)}</div><div class="stats-sub muted tiny">${s.avgRating ? "Visible reviews only" : "—"}</div></div>
      <div class="stats-card"><div class="stats-label">Est. earnings</div><div class="stats-value">${formatPHP(s.earnings)}</div><div class="stats-sub muted tiny">${escapeHTML(s.pricingType)} • ${formatPHP(s.amount)}${s.pricingType === "Hourly" ? "/hr" : "/job"}</div></div>
    </div>
  `;
}

/* ---------------------------
  Tabs
---------------------------- */
export function providerSetTab(tab) {
  activeProviderTab = tab;

  byId("provider-tab-bookings")?.classList.toggle("hidden", tab !== "bookings");
  byId("provider-tab-profile")?.classList.toggle("hidden", tab !== "profile");
  byId("provider-tab-availability")?.classList.toggle("hidden", tab !== "availability");
  byId("provider-tab-chat")?.classList.toggle("hidden", tab !== "chat");

  byId("tabBookings")?.classList.toggle("tab-active", tab === "bookings");
  byId("tabProfile")?.classList.toggle("tab-active", tab === "profile");
  byId("tabAvailability")?.classList.toggle("tab-active", tab === "availability");
  byId("tabChat")?.classList.toggle("tab-active", tab === "chat");
}

/* ---------------------------
  Booking lifecycle + conflict prevention + notifications
---------------------------- */
function getMyBooking(bookingId) {
  const me = getMeProvider();
  if (!me) return null;
  const b = state.bookings.find(x => x.id === bookingId);
  if (!b || b.providerId !== me.id) return null;
  return b;
}

function providerHasConflict(me, bookingToAccept) {
  const blocked = state.availability.some(a => a.providerId === me.id && a.date === bookingToAccept.date);
  if (blocked) return true;

  const activeStatuses = new Set(["Accepted", "Ongoing", "Completed"]);
  const others = state.bookings.filter(b =>
    b.providerId === me.id &&
    b.id !== bookingToAccept.id &&
    b.date === bookingToAccept.date &&
    activeStatuses.has(b.status)
  );

  if (!others.length) return false;

  const reqRange = parseTimeRange(bookingToAccept.time);
  if (!reqRange) return true;

  return others.some(b => {
    const br = parseTimeRange(b.time);
    if (!br) return true;
    return overlaps(reqRange, br);
  });
}

function setBookingStatus(bookingId, nextStatus) {
  const me = getMeProvider();
  const b = getMyBooking(bookingId);
  if (!me || !b) return alert("Booking not found.");

  const current = b.status || "Pending";

  const allowed = {
    Pending: ["Accepted", "Declined"],
    Accepted: ["Ongoing", "Declined"],
    Ongoing: ["Completed"],
    Completed: [],
    Closed: []
  };

  if (!(allowed[current] || []).includes(nextStatus)) {
    return alert(`Invalid transition: ${current} → ${nextStatus}`);
  }

  if (nextStatus === "Accepted") {
    if (providerHasConflict(me, b)) {
      return alert("You already have a conflicting booking or you are unavailable on that date.");
    }
  }

  b.status = nextStatus;
  b.updatedAt = Date.now();

  if (nextStatus === "Accepted") b.acceptedAt = Date.now();
  if (nextStatus === "Declined") b.declinedAt = Date.now();
  if (nextStatus === "Ongoing") b.startedAt = Date.now();
  if (nextStatus === "Completed") b.completedAt = Date.now();

  saveArray(K.bookings, state.bookings);
  updateBell();

  // ✅ Notify client about booking status changes
  if (b.clientId) {
    const msgMap = {
      Accepted: `Your booking was accepted ✅ (${b.service} on ${b.date} ${b.time})`,
      Declined: `Your booking was declined ❌ (${b.service} on ${b.date} ${b.time})`,
      Ongoing: `Your booking is now ongoing 🛠 (${b.service})`,
      Completed: `Your booking was marked completed ✅ Please confirm to close.`
    };

    if (msgMap[nextStatus]) {
      addNotification({
        toRole: "client",
        toId: b.clientId,
        title: "Booking update",
        message: msgMap[nextStatus],
        linkPage: "client-dashboard"
      });
    }
  }

  renderProviderDashboard();
}

export function renderProviderDashboard() {
  ensureGlobalHooks();
  renderProviderStats();

  const me = getMeProvider();
  const list = byId("provider-bookings");
  if (!list) return;

  if (!me) {
    list.innerHTML = `<p class="muted">Provider login required.</p>`;
    return;
  }

  const my = state.bookings
    .filter(b => b.providerId === me.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (my.length === 0) {
    list.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  list.innerHTML = my.map(b => {
    const status = b.status || "Pending";
    const meta = [
      b.clientName ? `Client: ${escapeHTML(b.clientName)}` : "",
      b.category ? `Category: ${escapeHTML(b.category)}` : "",
      b.service ? `Service: ${escapeHTML(b.service)}` : "",
      b.date ? `Date: ${escapeHTML(b.date)}` : "",
      b.time ? `Time: ${escapeHTML(b.time)}` : "",
      b.address ? `Address: ${escapeHTML(b.address)}` : ""
    ].filter(Boolean).join(" • ");

    const actionButtons = (() => {
      if (status === "Pending") {
        return `
          <button class="action-btn" type="button" data-provider-booking-action="Accepted" data-booking-id="${escapeHTML(b.id)}">Accept</button>
          <button class="action-btn" type="button" data-provider-booking-action="Declined" data-booking-id="${escapeHTML(b.id)}">Decline</button>
        `;
      }
      if (status === "Accepted") {
        return `
          <button class="action-btn" type="button" data-provider-booking-action="Ongoing" data-booking-id="${escapeHTML(b.id)}">Start Job</button>
          <button class="action-btn" type="button" data-provider-booking-action="Declined" data-booking-id="${escapeHTML(b.id)}">Cancel</button>
        `;
      }
      if (status === "Ongoing") {
        return `<button class="action-btn" type="button" data-provider-booking-action="Completed" data-booking-id="${escapeHTML(b.id)}">Mark Completed</button>`;
      }
      if (status === "Completed") return `<span class="muted tiny">Waiting for client confirmation → Closed</span>`;
      if (status === "Closed") return `<span class="muted tiny">Closed</span>`;
      if (status === "Declined" || status === "Cancelled") return `<span class="muted tiny">${escapeHTML(status)}</span>`;
      return ``;
    })();

    const chatBtn = `<button class="action-btn" type="button" data-chat-open="provider:${escapeHTML(b.id)}">Open Chat</button>`;

    return `
      <div class="dash-item">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
          <div>
            <div><b>${escapeHTML(status)}</b></div>
            <div class="muted tiny">${meta || "Booking details"}</div>
            ${b.notes ? `<div class="muted tiny">Notes: ${escapeHTML(b.notes)}</div>` : ""}
          </div>
          <div class="muted tiny">${b.createdAt ? new Date(b.createdAt).toLocaleString() : ""}</div>
        </div>

        <div class="action-row" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          ${actionButtons}
          ${chatBtn}
        </div>
      </div>
    `;
  }).join("");
}

/* ---------------------------
  Profile actions (unchanged)
---------------------------- */
export function providerLoadProfileForm() {}
export function providerSaveProfile() {}
export function providerAddServiceFromProfile() {}

export async function providerRequestVerification() {
  const me = getMeProvider();
  if (!me) return alert("Provider login required.");

  const file = byId("verify-file")?.files?.[0];
  if (!file) return alert("Please choose an image (ID/selfie) first.");

  const dataUrl = await fileToDataUrl(file);
  if (!dataUrl) return alert("Could not read file. Try again.");

  const alreadyPending = state.verifyRequests.some(v => v.providerId === me.id && v.status === "Pending");
  if (alreadyPending) return alert("You already have a pending verification request.");

  state.verifyRequests.push({
    id: makeId(),
    providerId: me.id,
    providerName: me.profile?.name || "Provider",
    fileDataUrl: dataUrl,
    status: "Pending",
    createdAt: Date.now()
  });

  saveArray(K.verifyRequests, state.verifyRequests);

  // ✅ Notify admin
  addNotification({
    toRole: "admin",
    toId: "admin",
    title: "New verification request",
    message: `${me.profile?.name || "Provider"} submitted a verification request.`,
    linkPage: "admin-page"
  });

  updateBell();
  alert("Verification request submitted.");
}

export async function providerChangePassword() {}
export function providerAddUnavailable() {}
export function renderProviderAvailability() {}

function installProviderDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-provider-booking-action]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    setBookingStatus(el.dataset.bookingId, el.dataset.providerBookingAction);
  }, true);
}

ensureGlobalHooks();
installProviderDelegation();
