
import { showPage, goHome, goBack } from "./routing.js";
import { toggleTheme } from "./theme.js";
import { openNotifications } from "./nav.js";
import {
  providerSetTab,
  providerSaveProfile,
  providerAddServiceFromProfile,
  providerRequestVerification,
  providerChangePassword,
  providerAddUnavailable
} from "./providerDashboard.js";
import {
  authUnifiedSignIn,
  authUnifiedClientSignUp,
  authUnifiedStartProviderSignup
} from "./authUnified.js";

import { clientSetTab } from "./clientDashboard.js";
import { clientSignIn, clientSignUp, providerSignIn, unifiedSignIn, unifiedClientSignUp,logout } from "./auth.js";
import { addProviderService } from "./providerServices.js";
import { setClientNearMe, useMyLocation, setProviderLocation } from "./geo.js";
import { searchService, selectCategory, openReportModal, submitReport, blockTarget, closeReportModal } from "./search.js";
import { openBooking, submitBooking } from "./booking.js";
import { sendChatMessage, sendChatMessageProvider, clientOpenChat, providerOpenChat } from "./chat.js";
import { submitReview, resetReviews } from "./reviews.js";

export function bindAllEvents() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-page],[data-action],[data-tab],[data-book-provider],[data-category],[data-provider],[data-chat-open]");
    if (!el) return;
    if (el.dataset.page) return showPage(el.dataset.page);
    if (el.dataset.bookProvider) return openBooking(el.dataset.bookProvider);
    if (el.dataset.category) return selectCategory(el.dataset.category);

    // Chat open
    if (el.dataset.chatOpen) {
      const [who, bookingId] = el.dataset.chatOpen.split(":");
      if (who === "client") return clientOpenChat(bookingId);
      if (who === "provider") return providerOpenChat(bookingId);
      return;
    }

    // Tabs
    if (el.dataset.tab) {
      const [who, tab] = el.dataset.tab.split(":");
      if (who === "client") return clientSetTab(tab);
      if (who === "provider") return providerSetTab(tab);
      return;
    }

    // action dispatcher
    switch (el.dataset.action) {
      case "home": return goHome();
      case "back": return goBack();
      case "toggleTheme": return toggleTheme();
      case "notifications": return openNotifications();
      case "logout": return logout();
      case "clientSignIn": return clientSignIn();
      case "clientSignUp": return clientSignUp();
      case "providerSignIn": return providerSignIn();
      case "providerSignUp": return providerSignUp();
      case "unifiedSignIn": return unifiedSignIn();
      case "unifiedClientSignUp": return unifiedClientSignUp();
      case "startProviderSignup": return showPage("provider-signup");
      case "authUnifiedSignIn": return authUnifiedSignIn();
      case "authUnifiedClientSignUp": return authUnifiedClientSignUp();
      case "authUnifiedStartProviderSignup": return authUnifiedStartProviderSignup();

      // Provider signup service add
      case "addProviderService": return addProviderService();

      // Geo
      case "setClientNearMe": return setClientNearMe();
      case "useMyLocation": return useMyLocation();
      case "setProviderLocation": return setProviderLocation();

      // Search / reports
      case "searchService": return searchService();
      case "openReportModal": return openReportModal(el.dataset.provider);
      case "submitReport": return submitReport();
      case "blockTarget": return blockTarget();
      case "closeReportModal": return closeReportModal();

      // Booking
      case "submitBooking": return submitBooking();

      // Chat send
      case "sendChatMessage": return sendChatMessage();
      case "sendChatMessageProvider": return sendChatMessageProvider();

      // Reviews
      case "submitReview": return submitReview();
      case "resetReviews": return resetReviews();

      // Provider dashboard actions
      case "providerSaveProfile": return providerSaveProfile();
      case "providerAddServiceFromProfile": return providerAddServiceFromProfile();
      case "providerRequestVerification": return providerRequestVerification();
      case "providerChangePassword": return providerChangePassword();
      case "providerAddUnavailable": return providerAddUnavailable();
      default: return;
    }
  });

  // Accessible logo keyboard support
  const logo = document.querySelector(".logo[data-action='home']");
  if (logo) {
    logo.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goHome();
      }
    });
  }
}
