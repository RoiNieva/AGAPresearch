// js/app.js
import { applyTheme } from "./theme.js";
import { setupMobileNav, setupAccessibleLogo, updateNav, updateBell } from "./nav.js";

import { initAdvancedFiltersToggle, initClientSearchFilters } from "./search.js";
import { initApp } from "./init.js";
import { bindAllEvents } from "./events.js";

import { initProviderSignupWizard } from "./providerSignupWizard.js";
import { initProviderServicePickers, installProviderServicesDelegation } from "./providerServices.js";

import { initPageLoadMotion, initScrollRevealMotion } from "./motion.js";

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  setupMobileNav();
  setupAccessibleLogo();

  initAdvancedFiltersToggle();
  initClientSearchFilters();

  initPageLoadMotion();
  initScrollRevealMotion(document);

  bindAllEvents();

  // Provider signup UI
  initProviderSignupWizard();
  initProviderServicePickers();
  installProviderServicesDelegation();

  // Nav state
  updateNav?.();
  updateBell?.();

  await initApp();
});
