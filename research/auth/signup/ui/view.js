// js/signup/ui/view.js
import { $, $$ } from "../core/dom.js";
import { currentSteps, uiRefs, buttons } from "../core/state.js";
import { renderStepper } from "./stepper.js";

export function showStep(stepId) {
  $$(".step").forEach(s => s.classList.add("hidden"));
  $(`.step[data-step="${stepId}"]`)?.classList.remove("hidden");

  // Badges
  if (uiRefs.state.role) {
    uiRefs.roleBadge.classList.remove("hidden");
    uiRefs.roleBadge.textContent = uiRefs.state.role.toUpperCase();

    uiRefs.stepBadge.classList.remove("hidden");
    uiRefs.stepBadge.textContent = `Step ${uiRefs.state.stepIndex + 1} of ${currentSteps().length}`;
  } else {
    uiRefs.roleBadge.classList.add("hidden");
    uiRefs.stepBadge.classList.add("hidden");
  }

  // Subtitle
  if (stepId === "role") uiRefs.subtitle.textContent = "Choose your role to begin.";
  else if (stepId === "providerReview") uiRefs.subtitle.textContent = "Review your information before confirming.";
  else uiRefs.subtitle.textContent = "Complete the fields then proceed.";

  // Buttons
  buttons.btnBack.disabled = (stepId === "role");
  const isLastBeforeSubmit = (uiRefs.state.stepIndex === currentSteps().length - 1);
  buttons.btnNext.classList.toggle("hidden", isLastBeforeSubmit);
  buttons.btnSubmit.classList.toggle("hidden", !isLastBeforeSubmit);

  // Stepper
  if (uiRefs.state.role) {
    uiRefs.stepper.classList.remove("hidden");
    renderStepper();
  } else {
    uiRefs.stepper.classList.add("hidden");
  }

  $("#main")?.focus();
}
