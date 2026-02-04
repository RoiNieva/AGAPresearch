// js/nav.js
import { byId } from "./dom.js";
import { getSession } from "./storage.js";
import { state } from "./state.js";
import { countUnreadForSession, listNotificationsForSession, markAllReadForSession } from "./notifications.js";
import { escapeHTML } from "./utils.js";

export function setupMobileNav() {
  const toggle = byId("navToggle");
  const menu = byId("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

export function closeMobileMenu() {
  const menu = byId("navMenu");
  if (menu?.classList.contains("open")) menu.classList.remove("open");
}

export function setupAccessibleLogo() {
  // handled in events.js via data-action="home"
}

export function updateNav() {
  const sess = getSession();
  const navClientDash = byId("navClientDash");
  const navProviderDash = byId("navProviderDash");
  const navAdmin = byId("navAdmin");
  const navLogout = byId("navLogout");

  [navClientDash, navProviderDash, navAdmin, navLogout].forEach(x => x?.classList.add("hidden"));

  if (!sess) return;
  navLogout?.classList.remove("hidden");
  if (sess.role === "client") navClientDash?.classList.remove("hidden");
  if (sess.role === "provider") navProviderDash?.classList.remove("hidden");
  if (sess.role === "admin") navAdmin?.classList.remove("hidden");
}

export function updateBell() {
  const sess = getSession();
  const badge = byId("bellCount");
  if (!badge) return;

  if (!sess) {
    badge.classList.add("hidden");
    return;
  }

  // ✅ NEW: bell shows unread notification count
  const unread = countUnreadForSession(sess);

  if (unread > 0) {
    badge.textContent = String(unread);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* ---------------------------
   Notifications modal
---------------------------- */
function ensureNotifModal() {
  let modal = byId("notifModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "notifModal";
  modal.className = "modal hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Notifications");

  modal.innerHTML = `
    <div class="modal-card" style="max-width:720px;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <h3 style="margin:0;">Notifications</h3>
        <button class="action-btn" type="button" data-notif-close="1">Close</button>
      </div>
      <div class="divider"></div>
      <div id="notifList"></div>
      <p class="muted tiny" style="margin-top:10px;">Notifications are saved on this device (localStorage).</p>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeNotifications();
  });

  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-notif-close]");
    if (closeBtn) closeNotifications();

    const item = e.target.closest("[data-notif-open]");
    if (item) {
      const page = item.dataset.notifOpen || "";
      closeNotifications();
      if (page) window.__routerShowPage?.(page);
    }
  });

  return modal;
}

function renderNotificationsList() {
  const sess = getSession();
  const list = byId("notifList");
  if (!list) return;

  if (!sess) {
    list.innerHTML = `<p class="muted">Sign in to see notifications.</p>`;
    return;
  }

  const items = listNotificationsForSession(sess, 50);

  if (!items.length) {
    list.innerHTML = `<p class="muted">No notifications yet.</p>`;
    return;
  }

  list.innerHTML = items.map(n => {
    const date = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
    const unread = !n.readAt;

    return `
      <div class="card soft" style="margin-bottom:10px; border:${unread ? "1px solid rgba(124,247,255,.35)" : "1px solid rgba(255,255,255,.12)"};">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:700;">${escapeHTML(n.title || "")} ${unread ? `<span class="trust-badge verified" style="margin-left:6px;">NEW</span>` : ""}</div>
            ${n.message ? `<div class="muted tiny" style="margin-top:4px;">${escapeHTML(n.message)}</div>` : ""}
            <div class="muted tiny" style="margin-top:6px;">${escapeHTML(date)}</div>
          </div>
          ${n.linkPage ? `<button class="action-btn" type="button" data-notif-open="${escapeHTML(n.linkPage)}">Open</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

export function openNotifications() {
  const sess = getSession();
  if (!sess) return alert("Sign in to see notifications.");

  const modal = ensureNotifModal();
  renderNotificationsList();

  // mark read
  markAllReadForSession(sess);
  updateBell();

  modal.classList.remove("hidden");
}

export function closeNotifications() {
  byId("notifModal")?.classList.add("hidden");
}
