// js/nav.js
import { byId } from "./dom.js";
import { getSession } from "./storage.js";
import { state } from "./state.js";

let currentActivePage = "landing-page";

/* ---------------------------
  Mobile Nav
---------------------------- */
export function setupMobileNav() {
  const toggle = byId("navToggle");
  const menu = byId("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // ✅ close menu when clicking any nav button
  menu.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    closeMobileMenu();
  });
}

export function closeMobileMenu() {
  const menu = byId("navMenu");
  const toggle = byId("navToggle");
  if (!menu) return;

  if (menu.classList.contains("open")) {
    menu.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  }
}

/* ---------------------------
  Logo accessibility
---------------------------- */
export function setupAccessibleLogo() {
  const logo = document.querySelector(".logo");
  if (!logo) return;

  // click
  logo.addEventListener("click", () => {
    window.__routerShowPage?.("landing-page");
    setActiveNav("landing-page");
    closeMobileMenu();
  });

  // keyboard (Enter / Space)
  logo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.__routerShowPage?.("landing-page");
      setActiveNav("landing-page");
      closeMobileMenu();
    }
  });
}

/* ---------------------------
  Active nav highlight
---------------------------- */
export function setActiveNav(pageId) {
  currentActivePage = pageId || currentActivePage;

  // Remove active from all
  document.querySelectorAll("#navMenu .nav-link").forEach((b) => {
    b.classList.remove("nav-active");
  });

  // Match button for current page
  if (currentActivePage === "landing-page") {
    document.querySelector('#navMenu .nav-link[data-action="home"]')?.classList.add("nav-active");
    return;
  }

  document
    .querySelector(`#navMenu .nav-link[data-page="${currentActivePage}"]`)
    ?.classList.add("nav-active");
}

/* ---------------------------
  Show/Hide nav items by role
---------------------------- */
export function updateNav() {
  const sess = getSession();

  const navClientDash = byId("navClientDash");
  const navProviderDash = byId("navProviderDash");
  const navAdmin = byId("navAdmin");
  const navLogout = byId("navLogout");

  const navFindPro = document.querySelector('.nav-link.nav-cta[data-page="client-search"]');
  const navMap = document.querySelector('.nav-link[data-page="map-page"]');

  // reset: hide dashboards + logout
  [navClientDash, navProviderDash, navAdmin, navLogout].forEach((x) => x?.classList.add("hidden"));

  // defaults for guests
  navFindPro?.classList.remove("hidden");
  navMap?.classList.add("hidden");

  // keep highlight correct
  setActiveNav(currentActivePage);

  // guest -> stop here
  if (!sess) return;

  // logged in
  navLogout?.classList.remove("hidden");

  if (sess.role === "client") navClientDash?.classList.remove("hidden");
  if (sess.role === "provider") navProviderDash?.classList.remove("hidden");
  if (sess.role === "admin") navAdmin?.classList.remove("hidden");

  // provider: hide Find a Pro
  if (sess.role === "provider") navFindPro?.classList.add("hidden");

  // map: only for client
  if (sess.role === "client") navMap?.classList.remove("hidden");
  else navMap?.classList.add("hidden");

  // keep highlight correct
  setActiveNav(currentActivePage);
}

/* ---------------------------
  Bell
---------------------------- */
export function updateBell() {
  const sess = getSession();
  const badge = byId("bellCount");
  if (!badge) return;

  let count = 0;

  if (sess?.role === "provider") {
    count = state.bookings.filter((b) => b.providerId === sess.id && b.status === "Pending").length;
  } else if (sess?.role === "client") {
    count = state.bookings.filter(
      (b) => b.clientId === sess.id && ["Accepted", "Ongoing", "Completed"].includes(b.status)
    ).length;
  } else if (sess?.role === "admin") {
    count = state.verifyRequests.filter((v) => v.status === "Pending").length;
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

  closeMobileMenu();
}
