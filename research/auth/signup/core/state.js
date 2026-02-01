// js/signup/core/state.js
import { $ } from "./dom.js";

export const DRAFT_KEY = "agap_signup_draft_v1";

export const STEP_MAP = {
  client: ["role", "account", "profile"],
  provider: ["role", "account", "profile", "providerProfessional", "providerRequirements", "providerAvailability", "providerReview"]
};

export const state = {
  role: null,
  stepIndex: 0,
  data: {}
};

export function currentSteps() {
  if (!state.role) return ["role"];
  return STEP_MAP[state.role];
}

export function currentStepId() {
  return currentSteps()[state.stepIndex] || "role";
}

/** Cached DOM refs */
export const form = $("#signupForm");

export const uiRefs = {
  state,
  subtitle: $("#signupSubtitle"),
  roleBadge: $("#roleBadge"),
  stepBadge: $("#stepBadge"),
  stepper: $("#stepper"),
  stepperList: $("#stepperList"),
  stepperProgress: $("#stepperProgress"),
  msg: $("#formMsg")
};

export const buttons = {
  btnBack: $("#btnBack"),
  btnNext: $("#btnNext"),
  btnSubmit: $("#btnSubmit"),
  btnSaveDraft: $("#btnSaveDraft"),
  btnLoadDraft: $("#btnLoadDraft"),
  btnClearDraft: $("#btnClearDraft")
};
