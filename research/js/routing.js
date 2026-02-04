import { byId } from "./dom.js";
import { getSession } from "./storage.js";
import { closeMobileMenu } from "./nav.js";
import { animatePageEnter } from "./motion.js";
import { setActiveNav } from "./nav.js";
import {
  providerSetTab,
  renderProviderDashboard,
  providerLoadProfileForm,
  renderProviderAvailability
} from "./providerDashboard.js";

import { clientSetTab, renderClientDashboard } from "./clientDashboard.js";
import { renderProviderChatBookingList, renderClientChatBookingList } from "./chat.js";
import { populateReviewProviders, renderReviewsList } from "./reviews.js";
import { buildCategoryGrid } from "./search.js";
import { renderAdmin } from "./admin.js";


let currentPage = "home";
const historyStack = ["home"];

function pushHistory(pageId) {
  if (!pageId) return;
  if (historyStack[historyStack.length - 1] === pageId) return;
  historyStack.push(pageId);
}

export function goBack() {
  if (historyStack.length > 1) historyStack.pop();
  const prev = historyStack[historyStack.length - 1] || "home";
  navigate(prev, { push: false });
}


export function showOnly(pageId) {
  byId("landing-page")?.classList.add("hidden");
  byId("agap-section")?.classList.add("hidden");
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

  const el = byId(pageId);
  if (!el) return;

  el.classList.remove("hidden");
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });

  animatePageEnter(el);
  setActiveNav(pageId);
}

function showHomeOnly() {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  byId("landing-page")?.classList.remove("hidden");
  byId("agap-section")?.classList.remove("hidden");

  animatePageEnter(byId("landing-page"));
  animatePageEnter(byId("agap-section"));
}

/* ---------------------------
   Navigation engine
---------------------------- */
function navigate(pageId, { push = true } = {}) {
  closeMobileMenu();

  if (pageId === "home") {
    showHomeOnly();
    currentPage = "home";
    if (push) pushHistory("home");
    return;
  }

  // run page-specific renders BEFORE showing
  if (pageId === "provider-dashboard") {
    providerSetTab("bookings");
    renderProviderDashboard();
    providerLoadProfileForm();
    renderProviderAvailability();
    renderProviderChatBookingList();
  }

  if (pageId === "client-dashboard") {
    clientSetTab("bookings");
    renderClientDashboard();
    renderClientChatBookingList();
  }

  if (pageId === "reviews-page") {
    populateReviewProviders();
    renderReviewsList();
  }

  if (pageId === "categories-page") buildCategoryGrid();
  if (pageId === "admin-page") renderAdmin();

  showOnly(pageId);

  // lazy map load AFTER visible
  if (pageId === "map-page") {
    requestAnimationFrame(() => {
      import("./map.js")
        .then(m => m.initMapPage())
        .catch(err => console.error("Map failed to load:", err));
    });
  }

  currentPage = pageId;
  if (push) pushHistory(pageId);
}

/* 
   Public  API
 */
export function showPage(pageId) {
  const sess = getSession();

  // ✅ CHANGE: booking-page is now allowed for guests (preview mode)
  const needClient = ["client-dashboard"].includes(pageId);
  const needProvider = ["provider-dashboard"].includes(pageId);
  const needAdmin = ["admin-page"].includes(pageId);

  if (needClient && (!sess || sess.role !== "client")) {
    window.__redirectAfterAuth = pageId;
    navigate("auth-signin");
    return;
  }

  if (needProvider && (!sess || sess.role !== "provider")) {
    window.__redirectAfterAuth = pageId;
    navigate("auth-signin");
    return;
  }

  if (needAdmin && (!sess || sess.role !== "admin")) {
    alert("Admin demo login required. Use admin@agap.com / admin123");
    navigate("home");
    return;
  }

  navigate(pageId);
}

export function goHome() {
  navigate("home");
}

/* 
   Router hooks (for other modules)
 */
window.__routerShowPage = showPage;
window.__routerGoHome = goHome;
window.__routerGoBack = goBack;
