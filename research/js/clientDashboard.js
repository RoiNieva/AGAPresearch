// js/clientDashboard.js
import { byId } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { escapeHTML, formatDate } from "./utils.js";
import { updateBell } from "./nav.js";
import { renderClientChatBookingList, renderChatThreadClient } from "./chat.js";

let activeClientTab = "bookings";

function ensureGlobalHooks() {
  // chat.js uses window.clientSetTab?.("chat")
  window.clientSetTab = clientSetTab;
}

function getClientSession() {
  const sess = getSession();
  if (!sess || sess.role !== "client") return null;
  return sess;
}

function getMyBooking(bookingId) {
  const sess = getClientSession();
  if (!sess) return null;
  const b = state.bookings.find(x => x.id === bookingId);
  if (!b || b.clientId !== sess.id) return null;
  return b;
}

export function clientSetTab(tab) {
  activeClientTab = tab;

  const btnB = byId("clientTabBookings");
  const btnC = byId("clientTabChat");
  const tabB = byId("client-tab-bookings");
  const tabC = byId("client-tab-chat");

  if (tab === "bookings") {
    btnB?.classList.add("tab-active");
    btnC?.classList.remove("tab-active");
    tabB?.classList.remove("hidden");
    tabC?.classList.add("hidden");
  } else {
    btnB?.classList.remove("tab-active");
    btnC?.classList.add("tab-active");
    tabB?.classList.add("hidden");
    tabC?.classList.remove("hidden");

    renderClientChatBookingList();
    renderChatThreadClient();
  }
}

export function renderClientDashboard() {
  ensureGlobalHooks();

  const sess = getClientSession();
  const wrap = byId("client-bookings");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (!sess) {
    wrap.innerHTML = `<p class="muted">Please sign in.</p>`;
    return;
  }

  const my = state.bookings
    .filter(b => b.clientId === sess.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (my.length === 0) {
    wrap.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  wrap.innerHTML = my.map(b => {
    const status = b.status || "Pending";

    // Actions are now data-attributes (NO inline onclick)
    let actions = "";

    if (status === "Pending") {
      actions += `
        <button class="action-btn"
          type="button"
          data-client-booking-action="cancel"
          data-booking-id="${escapeHTML(b.id)}">Cancel</button>
      `;
    }

    if (status === "Completed") {
      actions += `
        <button class="action-btn"
          type="button"
          data-client-booking-action="confirm"
          data-booking-id="${escapeHTML(b.id)}">Confirm Completed</button>
      `;
    }

    // Chat button uses your system-wide event handler (events.js)
    actions += `
      <button class="action-btn"
        type="button"
        data-chat-open="client:${escapeHTML(b.id)}">Chat</button>
    `;

    return `
      <div class="card soft">
        <h3>${escapeHTML(b.service || "")}</h3>
        <p class="muted">Provider: ${escapeHTML(b.providerName || "")}</p>
        <p class="muted">📅 ${escapeHTML(formatDate(b.date))} • ⏰ ${escapeHTML(b.time || "")}</p>
        <p>Status: <b>${escapeHTML(status)}</b></p>
        <div class="action-row">${actions}</div>
      </div>
    `;
  }).join("");

  // keep current tab consistent if user navigates back
  if (activeClientTab === "chat") clientSetTab("chat");
}

function clientCancelBooking(bookingId) {
  const b = getMyBooking(bookingId);
  if (!b) return;

  if (b.status !== "Pending") return alert("You can only cancel pending bookings.");
  b.status = "Cancelled";
  b.updatedAt = Date.now();

  saveArray(K.bookings, state.bookings);
  updateBell();
  renderClientDashboard();
}

function clientConfirmCompleted(bookingId) {
  const b = getMyBooking(bookingId);
  if (!b) return;

  if (b.status !== "Completed") return alert("Not ready for confirmation.");
  b.status = "Closed";
  b.updatedAt = Date.now();

  saveArray(K.bookings, state.bookings);
  updateBell();
  renderClientDashboard();
}

/**
 * Delegated actions for the dashboard
 * (so you don't need to add more cases in events.js)
 */
function installClientDashboardDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-client-booking-action]");
    if (!el) return;

    const action = el.dataset.clientBookingAction;
    const bookingId = el.dataset.bookingId;
    if (!action || !bookingId) return;

    e.preventDefault();
    e.stopPropagation();

    if (action === "cancel") return clientCancelBooking(bookingId);
    if (action === "confirm") return clientConfirmCompleted(bookingId);
  }, true);
}

ensureGlobalHooks();
installClientDashboardDelegation();
