// js/signup/logic/review.js
import { $ } from "../core/dom.js";
import { currentSteps, uiRefs } from "../core/state.js";
import { showStep } from "../ui/view.js";

export function buildReview() {
  const d = uiRefs.state.data || {};
  const container = $("#reviewContainer");
  if (!container) return;

  const sections = [
    {
      title: "Account",
      editStep: "account",
      rows: [
        ["Email", d.email || "—"],
        ["Password", d.password ? "••••••••" : "—"]
      ]
    },
    {
      title: "Profile",
      editStep: "profile",
      rows: [
        ["Full name", d.fullName || "—"],
        ["Phone", d.phone || "—"],
        ["Address", d.address || "—"]
      ]
    },
    {
      title: "Professional",
      editStep: "providerProfessional",
      rows: [
        ["Category", d.category || "—"],
        ["Experience", (d.experienceYears !== "" ? `${d.experienceYears} years` : "—")],
        ["Bio", d.bio || "—"]
      ]
    },
    {
      title: "Requirements",
      editStep: "providerRequirements",
      rows: [
        ["Government ID", d.govId || "—"],
        ["Portfolio", d.portfolioUrl || "—"],
        ["Notes", d.certNotes || "—"]
      ]
    },
    {
      title: "Availability",
      editStep: "providerAvailability",
      rows: [
        ["Days", (d.days && d.days.length ? d.days.join(", ") : "—")],
        ["Time", (d.timeFrom && d.timeTo ? `${d.timeFrom} – ${d.timeTo}` : "—")]
      ]
    }
  ];

  container.innerHTML = "";

  sections.forEach(sec => {
    const wrap = document.createElement("div");
    wrap.className = "review-section";

    const head = document.createElement("div");
    head.className = "review-head";

    const t = document.createElement("div");
    t.className = "review-title";
    t.textContent = sec.title;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost";
    btn.textContent = "Edit";
    btn.addEventListener("click", () => jumpToStep(sec.editStep));

    head.appendChild(t);
    head.appendChild(btn);

    const kv = document.createElement("div");
    kv.className = "review-kv";

    sec.rows.forEach(([k, v]) => {
      const kEl = document.createElement("div");
      kEl.className = "muted";
      kEl.textContent = k;

      const vEl = document.createElement("div");
      vEl.textContent = v;

      kv.appendChild(kEl);
      kv.appendChild(vEl);
    });

    wrap.appendChild(head);
    wrap.appendChild(kv);
    container.appendChild(wrap);
  });
}

export function jumpToStep(stepId) {
  const steps = currentSteps();
  const idx = steps.indexOf(stepId);
  if (idx === -1) return;
  uiRefs.state.stepIndex = idx;
  showStep(steps[idx]);
}
