// js/nav.js
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

  // buttons we want to control
  const navFindPro = document.querySelector('.nav-link.nav-cta[data-page="client-search"]');
  const navMap = document.querySelector('.nav-link[data-page="map-page"]');

  // reset dashboard buttons
  [navClientDash, navProviderDash, navAdmin, navLogout].forEach(x => x?.classList.add("hidden"));

  // default: show Find a Pro, hide Map
  navFindPro?.classList.remove("hidden");
  navMap?.classList.add("hidden");

  // logged out: no dashboards/logout
  if (!sess) return;

  // logged in: show logout + correct dashboard
  navLogout?.classList.remove("hidden");
  if (sess.role === "client") navClientDash?.classList.remove("hidden");
  if (sess.role === "provider") navProviderDash?.classList.remove("hidden");
  if (sess.role === "admin") navAdmin?.classList.remove("hidden");

  // ✅ rule 1: if provider logged in, hide Find a Pro
  if (sess.role === "provider") {
    navFindPro?.classList.add("hidden");
  }

  // ✅ rule 2: Map button only available after client is logged in
  if (sess.role === "client") {
    navMap?.classList.remove("hidden");
  } else {
    navMap?.classList.add("hidden");
  }
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
