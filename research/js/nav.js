import { byId } from "./dom.js";
import { getSession } from "./storage.js";
import { state } from "./state.js";

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

  let count = 0;
  if (sess?.role === "provider") {
    count = state.bookings.filter(b => b.providerId === sess.id && b.status === "Pending").length;
  } else if (sess?.role === "client") {
    count = state.bookings.filter(b => b.clientId === sess.id && ["Accepted","Ongoing","Completed"].includes(b.status)).length;
  } else if (sess?.role === "admin") {
    count = state.verifyRequests.filter(v => v.status === "Pending").length;
  }

  if (count > 0) {
    badge.textContent = String(count);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

export function openNotifications() {
  const sess = getSession();
  if (!sess) return alert("Sign in to see notifications.");
  if (sess.role === "provider") window.__routerShowPage?.("provider-dashboard");
  if (sess.role === "client") window.__routerShowPage?.("client-dashboard");
  if (sess.role === "admin") window.__routerShowPage?.("admin-page");
}
