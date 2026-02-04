// js/admin.js
import { byId } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray } from "./storage.js";
import { escapeHTML } from "./utils.js";
import { updateBell } from "./nav.js";
import { addNotification } from "./notifications.js";

export function renderAdmin() {
  renderAdminVerifyList();
  renderAdminProviderList();
  renderAdminReports();
  updateBell();
}

function renderAdminVerifyList() {
  const wrap = byId("admin-verify-list");
  if (!wrap) return;
  wrap.innerHTML = "";

  const list = state.verifyRequests
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">No verification requests.</p>`;
    return;
  }

  list.forEach(v => {
    const div = document.createElement("div");
    div.className = "card soft";

    const img = v.fileDataUrl || v.image || "";

    div.innerHTML = `
      <h3>${escapeHTML(v.providerName || "Provider")}</h3>
      <p class="muted">Status: <b>${escapeHTML(v.status || "Pending")}</b></p>

      ${img ? `<img src="${img}" alt="Verification upload" class="booking-photo" />` : `<p class="muted tiny">No image attached.</p>`}

      <div class="action-row">
        <button class="action-btn" type="button" data-admin-verify="${escapeHTML(v.id)}" data-admin-status="Approved">Approve</button>
        <button class="action-btn" type="button" data-admin-verify="${escapeHTML(v.id)}" data-admin-status="Rejected">Reject</button>
      </div>
    `;
    wrap.appendChild(div);
  });
}

export function adminSetVerify(reqId, status) {
  const req = state.verifyRequests.find(r => r.id === reqId);
  if (!req) return;

  req.status = status;
  saveArray(K.verifyRequests, state.verifyRequests);

  const p = state.providers.find(x => x.id === req.providerId);
  if (p) {
    p.verified = (status === "Approved");
    saveArray(K.providers, state.providers);
  }

  // ✅ Notify provider
  addNotification({
    toRole: "provider",
    toId: req.providerId,
    title: "Verification update",
    message: status === "Approved"
      ? "Your verification was approved ✅"
      : "Your verification was rejected ❌ (please re-submit)",
    linkPage: "provider-dashboard"
  });

  renderAdmin();
}

function renderAdminProviderList() {
  const wrap = byId("admin-provider-list");
  if (!wrap) return;
  wrap.innerHTML = "";

  if (state.providers.length === 0) {
    wrap.innerHTML = `<p class="muted">No providers.</p>`;
    return;
  }

  state.providers
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach(p => {
      const div = document.createElement("div");
      div.className = "card soft";

      const name = p.profile?.name || "Provider";
      const plan = p.subscription?.plan || "Free";

      div.innerHTML = `
        <h3>${escapeHTML(name)}</h3>
        <p class="muted">
          Verified: ${p.verified ? "Yes" : "No"} •
          Featured: ${p.featured ? "Yes" : "No"} •
          Plan: ${escapeHTML(plan)}
        </p>

        <div class="action-row">
          <button class="action-btn" type="button" data-admin-feature="${escapeHTML(p.id)}">
            ${p.featured ? "Unfeature" : "Feature"}
          </button>

          <button class="action-btn" type="button" data-admin-plan="${escapeHTML(p.id)}" data-plan="Free">Free</button>
          <button class="action-btn" type="button" data-admin-plan="${escapeHTML(p.id)}" data-plan="Pro">Pro</button>
          <button class="action-btn" type="button" data-admin-plan="${escapeHTML(p.id)}" data-plan="Premium">Premium</button>
        </div>
      `;
      wrap.appendChild(div);
    });
}

export function adminToggleFeatured(providerId) {
  const p = state.providers.find(x => x.id === providerId);
  if (!p) return;

  p.featured = !p.featured;
  saveArray(K.providers, state.providers);
  renderAdminProviderList();
}

export function adminSetPlan(providerId, plan) {
  const p = state.providers.find(x => x.id === providerId);
  if (!p) return;

  p.subscription = { plan, active: true };
  saveArray(K.providers, state.providers);
  renderAdminProviderList();
}

function renderAdminReports() {
  const wrap = byId("admin-report-list");
  if (!wrap) return;
  wrap.innerHTML = "";

  if (state.reports.length === 0) {
    wrap.innerHTML = `<p class="muted">No reports yet.</p>`;
    return;
  }

  state.reports
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 20)
    .forEach(r => {
      const target = state.providers.find(p => p.id === r.targetProviderId);
      const div = document.createElement("div");
      div.className = "card soft";
      div.innerHTML = `
        <h3>Report: ${escapeHTML(target?.profile?.name || "Provider")}</h3>
        <p class="muted">Reason: <b>${escapeHTML(r.reason || "")}</b></p>
        <p class="muted">${escapeHTML(r.details || "")}</p>
      `;
      wrap.appendChild(div);
    });
}

function installAdminDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-admin-verify],[data-admin-feature],[data-admin-plan]");
    if (!el) return;

    if (el.dataset.adminVerify) {
      e.preventDefault();
      e.stopPropagation();
      return adminSetVerify(el.dataset.adminVerify, el.dataset.adminStatus || "Pending");
    }

    if (el.dataset.adminFeature) {
      e.preventDefault();
      e.stopPropagation();
      return adminToggleFeatured(el.dataset.adminFeature);
    }

    if (el.dataset.adminPlan) {
      e.preventDefault();
      e.stopPropagation();
      return adminSetPlan(el.dataset.adminPlan, el.dataset.plan || "Free");
    }
  }, true);
}

installAdminDelegation();
