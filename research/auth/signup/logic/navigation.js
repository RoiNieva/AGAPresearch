// js/signup/logic/navigation.js
import { currentStepId, uiRefs } from "../core/state.js";
import { showStep } from "../ui/view.js";
import { validateStep } from "./validate.js";
import { buildReview } from "./review.js";
import { readFormIntoState } from "../data/formState.js";

export function goNext() {
  const stepId = currentStepId();
  const ok = validateStep(stepId);
  if (!ok) return;

  if (stepId === "role") {
    uiRefs.state.stepIndex = 1;
  } else {
    uiRefs.state.stepIndex += 1;
  }

  if (currentStepId() === "providerReview") {
    readFormIntoState();
    buildReview();
  }

  showStep(currentStepId());
}

export function goBack() {
  if (uiRefs.state.stepIndex <= 0) return;
  uiRefs.state.stepIndex -= 1;
  showStep(currentStepId());
}
