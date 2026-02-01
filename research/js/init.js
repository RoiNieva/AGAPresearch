// js/init.js
import { state } from "./state.js";
import { K, saveArray } from "./storage.js";
import { updateNav, updateBell } from "./nav.js";
import { buildCategoryGrid } from "./search.js";

/**
 * Small local hash so demo accounts can actually sign in.
 * Must match auth.js hashPassword() logic.
 */
async function hashPassword(password) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = ((h << 5) + h) + password.charCodeAt(i);
  return "h_" + (h >>> 0).toString(16);
}

export function initPageLoad() {
  requestAnimationFrame(() => {
    document.body.classList.add("page-loaded");
  });
}

/**
 * App init:
 * - Does NOT populate dropdowns anymore (app.js already does that):
 *   - initProviderServicePickers()
 *   - initClientSearchFilters()
 * - Seeds demo data once (with valid passHash)
 * - Builds category grid
 * - Updates nav/bell
 * - Registers service worker
 */
export async function initApp() {
  // Seed demo once
  if (!state.providers.length && !state.clients.length) {
    // Demo credentials:
    // Client: client@demo.com / demo12345
    // Provider: pro@demo.com / demo12345
    const demoPass = "demo12345";
    const demoHash = await hashPassword(demoPass);

    state.clients.push({
      id: "demo_client",
      name: "Demo Client",
      email: "client@demo.com",
      passHash: demoHash,
      createdAt: Date.now()
    });

    state.providers.push({
      id: "demo_pro",
      email: "pro@demo.com",
      passHash: demoHash,
      profile: {
        name: "Si tropang Roi",
        city: "Manila",
        date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        time: "8am-5pm",
        phone: "",
        messenger: ""
      },
      services: [{ category: "HOUSE REPAIR", service: "Plumber" }],
      serviceRadiusKm: 10,
      pricing: { type: "Fixed", amount: 500, currency: "PHP" },
      verified: false,
      featured: false,
      subscription: { plan: "Free", active: true },
      createdAt: Date.now()
    });

    saveArray(K.clients, state.clients);
    saveArray(K.providers, state.providers);
  }

  // Build category page cards
  buildCategoryGrid();

  // Update navigation + bell counts
  updateNav();
  updateBell();

  // Optional: add loaded class for transitions
  initPageLoad();

  // Service worker (if present)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
