// js/providerDashboard.js
import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { escapeHTML, makeId, fileToDataUrl } from "./utils.js";
import { updateBell } from "./nav.js";

let activeProviderTab = "bookings";

/* ---------------------------
  Helpers
---------------------------- */
function ensureGlobalHooks() {
  // chat.js uses window.providerSetTab?.("chat")
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

function normalizeServiceLabel(s) {
  if (!s) return "";
  if (typeof s === "string") return s;
  if (s.category && s.service) return `${s.category} — ${s.service}`;
  if (s.name) return String(s.name);
  return JSON.stringify(s);
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
  Booking lifecycle (Provider)
  Pending -> Accepted -> Ongoing -> Completed -> Closed (client)
---------------------------- */
function getMyBooking(bookingId) {
  const me = getMeProvider();
  if (!me) return null;
  const b = state.bookings.find(x => x.id === bookingId);
  if (!b || b.providerId !== me.id) return null;
  return b;
}

function setBookingStatus(bookingId, nextStatus) {
  const b = getMyBooking(bookingId);
  if (!b) return alert("Booking not found.");

  const current = b.status || "Pending";

  // enforce allowed transitions for provider
  const allowed = {
    Pending: ["Accepted", "Declined"],
    Accepted: ["Ongoing", "Declined"],
    Ongoing: ["Completed"],
    Completed: [], // provider cannot close it; client confirms -> Closed
    Closed: []
  };

  if (!(allowed[current] || []).includes(nextStatus)) {
    return alert(`Invalid transition: ${current} → ${nextStatus}`);
  }

  b.status = nextStatus;
  b.updatedAt = Date.now();

  if (nextStatus === "Accepted") b.acceptedAt = Date.now();
  if (nextStatus === "Declined") b.declinedAt = Date.now();
  if (nextStatus === "Ongoing") b.startedAt = Date.now();
  if (nextStatus === "Completed") b.completedAt = Date.now();

  saveArray(K.bookings, state.bookings);
  updateBell();

  renderProviderDashboard();
}

export function renderProviderDashboard() {
  ensureGlobalHooks();

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
        return `
          <button class="action-btn" type="button" data-provider-booking-action="Completed" data-booking-id="${escapeHTML(b.id)}">Mark Completed</button>
        `;
      }
      if (status === "Completed") {
        return `<span class="muted tiny">Waiting for client confirmation → Closed</span>`;
      }
      if (status === "Closed") {
        return `<span class="muted tiny">Closed</span>`;
      }
      if (status === "Declined" || status === "Cancelled") {
        return `<span class="muted tiny">${escapeHTML(status)}</span>`;
      }
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
  Profile: Load / Save
---------------------------- */
export function providerLoadProfileForm() {
  ensureGlobalHooks();

  const me = getMeProvider();
  if (!me) return;

  // Profile
  if (byId("pro-edit-name")) byId("pro-edit-name").value = me.profile?.name || "";
  if (byId("pro-edit-city")) byId("pro-edit-city").value = me.profile?.city || "";
  if (byId("pro-edit-date")) byId("pro-edit-date").value = me.profile?.date || "";
  if (byId("pro-edit-time")) byId("pro-edit-time").value = me.profile?.time || "";
  if (byId("pro-edit-phone")) byId("pro-edit-phone").value = me.profile?.phone || "";
  if (byId("pro-edit-messenger")) byId("pro-edit-messenger").value = me.profile?.messenger || "";

  // Pricing
  if (byId("pro-edit-price-type")) byId("pro-edit-price-type").value = me.pricing?.type || "Fixed";
  if (byId("pro-edit-price-amount")) byId("pro-edit-price-amount").value = String(me.pricing?.amount ?? 0);
  if (byId("pro-edit-radius")) byId("pro-edit-radius").value = String(me.serviceRadiusKm ?? 10);

  // Verification status
  const vs = byId("verify-status");
  if (vs) vs.textContent = me.verified ? "✅ Verified" : "Not verified yet.";

  // Plan status
  const ps = byId("plan-status");
  if (ps) {
    const sub = me.subscription || { plan: "Free", active: true };
    ps.textContent = `Plan: ${sub.plan || "Free"} • ${sub.active ? "Active" : "Inactive"}`;
  }

  renderProviderServicesEditor();
}

export function providerSaveProfile() {
  const me = getMeProvider();
  if (!me) return alert("Provider login required.");

  const name = val("pro-edit-name");
  const city = val("pro-edit-city");
  const date = byId("pro-edit-date")?.value || "";
  const time = val("pro-edit-time");

  if (!name || !city || !date || !time) return alert("Please fill required profile fields.");

  me.profile = {
    ...(me.profile || {}),
    name,
    city,
    date,
    time,
    phone: val("pro-edit-phone"),
    messenger: val("pro-edit-messenger")
  };

  me.pricing = {
    type: byId("pro-edit-price-type")?.value || "Fixed",
    amount: Number(byId("pro-edit-price-amount")?.value || 0),
    currency: "PHP"
  };

  me.serviceRadiusKm = Number(byId("pro-edit-radius")?.value || 10);

  saveArray(K.providers, state.providers);
  alert("Profile saved.");
  providerLoadProfileForm();
}

/* ---------------------------
  Profile: Services editor (add/remove)
---------------------------- */
function renderProviderServicesEditor() {
  const me = getMeProvider();
  const wrap = byId("pro-edit-services-list");
  if (!wrap) return;

  if (!me) {
    wrap.innerHTML = `<p class="muted tiny">Provider login required.</p>`;
    return;
  }

  const services = Array.isArray(me.services) ? me.services : [];
  if (services.length === 0) {
    wrap.innerHTML = `<p class="muted tiny">No services added yet.</p>`;
    return;
  }

  wrap.innerHTML = services.map((s, idx) => `
    <span class="chip" style="display:inline-flex; gap:8px; align-items:center; margin:4px;">
      ${escapeHTML(normalizeServiceLabel(s))}
      <button class="chip-x" type="button" data-provider-edit-service-remove="${idx}" aria-label="Remove service">✕</button>
    </span>
  `).join("");
}

export function providerAddServiceFromProfile() {
  const me = getMeProvider();
  if (!me) return alert("Provider login required.");

  const cat = byId("pro-edit-category")?.value || "";
  const svc = byId("pro-edit-service")?.value || "";
  if (!cat || !svc) return alert("Select category and service.");

  const item = { category: cat, service: svc };
  const list = Array.isArray(me.services) ? me.services : (me.services = []);

  const label = normalizeServiceLabel(item);
  if (list.some(x => normalizeServiceLabel(x) === label)) return alert("Service already added.");

  list.push(item);
  saveArray(K.providers, state.providers);
  renderProviderServicesEditor();
}

/* ---------------------------
  Provider Verification request
---------------------------- */
export async function providerRequestVerification() {
  const me = getMeProvider();
  if (!me) return alert("Provider login required.");

  const file = byId("verify-file")?.files?.[0];
  if (!file) return alert("Please choose an image (ID/selfie) first.");

  const dataUrl = await fileToDataUrl(file);
  if (!dataUrl) return alert("Could not read file. Try again.");

  const alreadyPending = state.verifyRequests.some(v => v.providerId === me.id && v.status === "Pending");
  if (alreadyPending) return alert("You already have a pending verification request.");

  const req = {
    id: makeId(),
    providerId: me.id,
    providerName: me.profile?.name || "Provider",
    fileDataUrl: dataUrl,
    status: "Pending",
    createdAt: Date.now()
  };

  state.verifyRequests.push(req);
  saveArray(K.verifyRequests, state.verifyRequests);

  const vs = byId("verify-status");
  if (vs) vs.textContent = "Verification request submitted. Await admin approval.";

  updateBell();
  alert("Verification request submitted.");
}

/* ---------------------------
  Change password
---------------------------- */
export async function providerChangePassword() {
  const me = getMeProvider();
  if (!me) return alert("Provider login required.");

  const oldPass = byId("pro-old-pass")?.value || "";
  const newPass = byId("pro-new-pass")?.value || "";
  const newPass2 = byId("pro-new-pass2")?.value || "";

  if (!oldPass || !newPass || !newPass2) return alert("Fill all password fields.");
  if (newPass.length < 8) return alert("New password must be at least 8 characters.");
  if (newPass !== newPass2) return alert("New passwords do not match.");

  const oldHash = await hashPassword(oldPass);
  if (oldHash !== me.passHash) return alert("Old password is incorrect.");

  me.passHash = await hashPassword(newPass);
  saveArray(K.providers, state.providers);

  if (byId("pro-old-pass")) byId("pro-old-pass").value = "";
  if (byId("pro-new-pass")) byId("pro-new-pass").value = "";
  if (byId("pro-new-pass2")) byId("pro-new-pass2").value = "";

  alert("Password updated.");
}

/* ---------------------------
  Availability: block dates
---------------------------- */
export function providerAddUnavailable() {
  const me = getMeProvider();
  if (!me) return alert("Provider login required.");

  const date = byId("avail-date")?.value || "";
  const note = val("avail-note");

  if (!date) return alert("Choose an unavailable date.");

  const dup = state.availability.some(a => a.providerId === me.id && a.date === date);
  if (dup) return alert("That date is already blocked.");

  state.availability.push({
    id: makeId(),
    providerId: me.id,
    date,
    note,
    createdAt: Date.now()
  });

  saveArray(K.availability, state.availability);

  if (byId("avail-note")) byId("avail-note").value = "";
  renderProviderAvailability();
  alert("Unavailable date added.");
}

function providerRemoveUnavailable(id) {
  const me = getMeProvider();
  if (!me) return;

  const idx = state.availability.findIndex(a => a.id === id && a.providerId === me.id);
  if (idx === -1) return;

  state.availability.splice(idx, 1);
  saveArray(K.availability, state.availability);
  renderProviderAvailability();
}

export function renderProviderAvailability() {
  const me = getMeProvider();
  const wrap = byId("avail-list");
  if (!wrap) return;

  if (!me) {
    wrap.innerHTML = `<p class="muted">Provider login required.</p>`;
    return;
  }

  const items = state.availability
    .filter(a => a.providerId === me.id)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (items.length === 0) {
    wrap.innerHTML = `<p class="muted">No blocked dates yet.</p>`;
    return;
  }

  wrap.innerHTML = items.map(a => `
    <div class="dash-item">
      <div style="display:flex; justify-content:space-between; gap:10px;">
        <div>
          <b>${escapeHTML(a.date)}</b>
          ${a.note ? `<div class="muted tiny">${escapeHTML(a.note)}</div>` : ""}
        </div>
        <button class="action-btn" type="button" data-provider-unavail-remove="${escapeHTML(a.id)}">Remove</button>
      </div>
    </div>
  `).join("");
}

/* ---------------------------
  Delegated handlers (booking actions + remove service + remove unavailable)
---------------------------- */
function installProviderDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-provider-booking-action],[data-provider-unavail-remove],[data-provider-edit-service-remove]");
    if (!el) return;

    // Booking status changes
    if (el.dataset.providerBookingAction) {
      const bookingId = el.dataset.bookingId;
      const next = el.dataset.providerBookingAction;
      if (!bookingId || !next) return;

      e.preventDefault();
      e.stopPropagation();
      return setBookingStatus(bookingId, next);
    }

    // Remove unavailable date
    if (el.dataset.providerUnavailRemove) {
      e.preventDefault();
      e.stopPropagation();
      return providerRemoveUnavailable(el.dataset.providerUnavailRemove);
    }

    // Remove service chip from profile
    if (el.dataset.providerEditServiceRemove != null) {
      const idx = Number(el.dataset.providerEditServiceRemove);
      const me = getMeProvider();
      if (!me || !Number.isFinite(idx)) return;

      e.preventDefault();
      e.stopPropagation();

      if (Array.isArray(me.services) && idx >= 0 && idx < me.services.length) {
        me.services.splice(idx, 1);
        saveArray(K.providers, state.providers);
        renderProviderServicesEditor();
      }
    }
  }, true);
}

ensureGlobalHooks();
installProviderDelegation();
