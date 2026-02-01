// js/signup/data/draft.js
import { DRAFT_KEY, currentSteps, uiRefs } from "../core/state.js";
import { setMessage } from "../ui/messages.js";
import { showStep } from "../ui/view.js";
import { readFormIntoState, hydrateFormFromState } from "./formState.js";

export function saveDraft() {
  readFormIntoState();
  const payload = {
    role: uiRefs.state.role,
    stepIndex: uiRefs.state.stepIndex,
    data: uiRefs.state.data
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  setMessage("Draft saved on this device.");
}

export function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return setMessage("No draft found.");

  try {
    const payload = JSON.parse(raw);
    uiRefs.state.role = payload.role || null;
    uiRefs.state.stepIndex = payload.stepIndex || 0;
    uiRefs.state.data = payload.data || {};

    hydrateFormFromState();

    // ensure stepIndex is valid
    const steps = currentSteps();
    if (uiRefs.state.stepIndex > steps.length - 1) uiRefs.state.stepIndex = steps.length - 1;

    showStep(steps[uiRefs.state.stepIndex] || "role");
    setMessage("Draft loaded.");
  } catch {
    setMessage("Draft is corrupted. Clear draft and try again.");
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  setMessage("Draft cleared.");
}
