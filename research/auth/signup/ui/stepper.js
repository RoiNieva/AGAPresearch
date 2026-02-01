// js/signup/ui/stepper.js
import { currentSteps, uiRefs } from "../core/state.js";

export function prettifyStep(id) {
  const map = {
    role: "Role",
    account: "Account",
    profile: "Profile",
    providerProfessional: "Professional",
    providerRequirements: "Requirements",
    providerAvailability: "Availability",
    providerReview: "Review"
  };
  return map[id] || id;
}

export function renderStepper() {
  const steps = currentSteps();
  uiRefs.stepperList.innerHTML = "";

  steps.forEach((id, i) => {
    const li = document.createElement("li");
    li.textContent = prettifyStep(id);
    if (i === uiRefs.state.stepIndex) li.classList.add("active");
    uiRefs.stepperList.appendChild(li);
  });

  const pct = steps.length <= 1 ? 0 : (uiRefs.state.stepIndex / (steps.length - 1)) * 100;
  uiRefs.stepperProgress.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}
