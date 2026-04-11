import { applyTheme } from "./theme.js";
import { setupMobileNav, setupAccessibleLogo, updateNav, updateBell } from "./nav.js";
import { initAdvancedFiltersToggle, initClientSearchFilters } from "./search.js";
import { initApp } from "./init.js";
import { bindAllEvents } from "./events.js";
import { initProviderSignupWizard } from "./providerSignupWizard.js";
import { initProviderServicePickers, installProviderServicesDelegation } from "./providerServices.js";
import { initAuthUnifiedUI } from "./authUnified.js";
import { initPageLoadMotion, initScrollRevealMotion } from "./motion.js";
import { initBookingUX } from "./bookingUX.js";
import { setupToast } from "./ui.js"; 




function initUnifiedSignupRoleToggle(){
  const clientBox = document.getElementById("auth-signup-client");
  const providerBox = document.getElementById("auth-signup-provider");
  if (!clientBox || !providerBox) return;

  const update = () => {
    const role = document.querySelector('input[name="auth-signup-role"]:checked')?.value || "client";
    clientBox.classList.toggle("hidden", role !== "client");
    providerBox.classList.toggle("hidden", role !== "provider");
  };

  document.querySelectorAll('input[name="auth-signup-role"]').forEach(r => {
    r.addEventListener("change", update);
  });

  update();
}


document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  setupMobileNav();
  setupAccessibleLogo();
  initUnifiedSignupRoleToggle();
  initAdvancedFiltersToggle();
  initClientSearchFilters();
  initPageLoadMotion();
  initScrollRevealMotion(document);
  bindAllEvents();
  initAuthUnifiedUI();
  initBookingUX();
  setupToast();
  // Provider signup UI
  initProviderSignupWizard();
  initProviderServicePickers();
  installProviderServicesDelegation();

  // Nav state
  updateNav?.();
  updateBell?.();
  await initApp();
});
