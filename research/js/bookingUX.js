import { byId } from "./dom.js";

function showErrors(msgs = []) {
  const box = byId("bookingErrors");
  if (!box) return;
  if (!msgs.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  box.classList.remove("hidden");
  box.innerHTML = `<b>Please fix the following:</b><ul class="list">${msgs.map(m => `<li>${m}</li>`).join("")}</ul>`;
}

function setStep(step) {
  const s1 = byId("booking-step-1");
  const s2 = byId("booking-step-2");
  const t1 = byId("bookStep1Btn");
  const t2 = byId("bookStep2Btn");

  s1?.classList.toggle("hidden", step !== 1);
  s2?.classList.toggle("hidden", step !== 2);

  t1?.classList.toggle("tab-active", step === 1);
  t2?.classList.toggle("tab-active", step === 2);

  showErrors([]);
}

function updateSummary() {
  const svc = byId("booking-service")?.value || "";
  const date = byId("booking-date")?.value || "";
  const time = byId("booking-time")?.value || "";
  const addr = byId("booking-address")?.value || "";

  const line = [
    svc && `Service: ${svc}`,
    date && `Date: ${date}`,
    time && `Time: ${time}`,
    addr && `Address: ${addr}`
  ].filter(Boolean).join("<br>");

  const el = byId("bookingSummaryText");
  if (!el) return;
  el.innerHTML = line || "Fill out details to preview.";
}

function validateStep1() {
  const errs = [];
  const svc = byId("booking-service")?.value || "";
  const date = byId("booking-date")?.value || "";
  const time = (byId("booking-time")?.value || "").trim();
  const addr = (byId("booking-address")?.value || "").trim();

  if (!svc) errs.push("Please select a service.");
  if (!date) errs.push("Please pick a preferred date.");
  if (!time) errs.push("Please enter a preferred time (example: 1pm-3pm).");
  if (!addr) errs.push("Please provide an address (Barangay/City is okay).");

  return errs;
}

export function initBookingUX() {
  const nextBtn = byId("bookingNextBtn");
  const backBtn = byId("bookingBackBtn");
  const t1 = byId("bookStep1Btn");
  const t2 = byId("bookStep2Btn");

  // live summary
  ["booking-service", "booking-date", "booking-time", "booking-address"].forEach(id => {
    byId(id)?.addEventListener("input", updateSummary);
    byId(id)?.addEventListener("change", updateSummary);
  });

  nextBtn?.addEventListener("click", () => {
    const errs = validateStep1();
    if (errs.length) return showErrors(errs);
    setStep(2);
  });

  backBtn?.addEventListener("click", () => setStep(1));

  t1?.addEventListener("click", () => setStep(1));
  t2?.addEventListener("click", () => {
    const errs = validateStep1();
    if (errs.length) return showErrors(errs);
    setStep(2);
  });

  // default
  setStep(1);
  updateSummary();
}
