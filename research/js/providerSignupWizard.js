import { byId, val } from "./dom.js";
import { state } from "./state.js";

let step = 0;
const STEP_TITLES = ["Profile", "Pricing", "Services", "Review", "Account"];

function qsAll(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function showStep(n) {
  step = n;

  const root = byId("provider-signup");
  if (!root) return;

  const panels = qsAll("#provider-signup .wizard-step");
  panels.forEach(p => p.classList.add("hidden"));
  panels.find(p => Number(p.dataset.step) === step)?.classList.remove("hidden");

  const subtitle = byId("pro-step-subtitle");
  if (subtitle) subtitle.textContent = `Step ${step + 1} of ${STEP_TITLES.length} — ${STEP_TITLES[step]}`;

  const fill = byId("pro-bar-fill");
  if (fill) fill.style.width = `${(step / (STEP_TITLES.length - 1)) * 100}%`;

  const pillsWrap = byId("pro-steps");
  if (pillsWrap && pillsWrap.childElementCount === 0) {
    STEP_TITLES.forEach(t => {
      const s = document.createElement("span");
      s.className = "wizard-pill";
      s.textContent = t;
      pillsWrap.appendChild(s);
    });
  }
  if (pillsWrap) [...pillsWrap.children].forEach((c, i) => c.classList.toggle("active", i === step));

  const backBtn = byId("pro-back-btn");
  const nextBtn = byId("pro-next-btn");
  const submitBtn = byId("pro-submit-btn");

  if (backBtn) backBtn.disabled = (step === 0);

  const isLast = (step === STEP_TITLES.length - 1);
  if (nextBtn) nextBtn.classList.toggle("hidden", isLast);
  if (submitBtn) submitBtn.classList.toggle("hidden", !isLast);

  if (step === 3) buildReview();
}

function buildReview() {
  const review = byId("pro-review");
  if (!review) return;

  const name = val("pro-name") || "—";
  const city = val("pro-city") || "—";
  const date = byId("pro-date")?.value || "—";
  const time = val("pro-time") || "—";
  const phone = val("pro-phone") || "—";
  const messenger = val("pro-messenger") || "—";

  const priceType = byId("pro-price-type")?.value || "—";
  const priceAmount = byId("pro-price-amount")?.value || "—";
  const radius = byId("pro-radius")?.value || "—";

  const services = (state.providerSelectedServices || []).map(s => {
    if (typeof s === "string") return s;
    if (s?.service && s?.category) return `${s.category} — ${s.service}`;
    if (s?.name) return s.name;
    return JSON.stringify(s);
  });

  const rows = [
    ["Full name", name],
    ["City", city],
    ["Available date", date],
    ["Available time", time],
    ["Phone", phone],
    ["Messenger", messenger],
    ["Pricing type", priceType],
    ["Price amount", `PHP ${priceAmount}`],
    ["Radius (km)", radius],
    ["Services", services.length ? services.join(", ") : "—"]
  ];

  review.innerHTML = rows.map(([k, v]) => `
    <div class="review-row">
      <div class="review-key">${escapeHtml(k)}</div>
      <div class="review-val">${escapeHtml(v)}</div>
    </div>
  `).join("");
}

function validateStep() {
  if (step === 0) {
    const name = val("pro-name");
    const city = val("pro-city");
    const date = byId("pro-date")?.value;
    const time = val("pro-time");
    if (!name || !city || !date || !time) return alert("Fill profile details."), false;
  }

  if (step === 2) {
    if (!state.providerSelectedServices?.length) return alert("Add at least 1 service."), false;
  }

  if (step === 3) {
    if (!byId("pro-confirm")?.checked) {
      alert("Please confirm your details before proceeding to account setup.");
      return false;
    }
  }

  if (step === 4) {
    const email = val("pro-signup-email").toLowerCase();
    const pass = val("pro-signup-password");
    const pass2 = val("pro-signup-password2");
    if (!email || !pass || !pass2) return alert("Fill account fields."), false;
    if (pass !== pass2) return alert("Passwords do not match."), false;
  }

  return true;
}

export function initProviderSignupWizard() {
  const root = byId("provider-signup");
  if (!root) return;

  byId("pro-next-btn")?.addEventListener("click", () => {
    if (!validateStep()) return;
    showStep(Math.min(step + 1, STEP_TITLES.length - 1));
  });

  byId("pro-back-btn")?.addEventListener("click", () => {
    showStep(Math.max(step - 1, 0));
  });

  showStep(0);
}
