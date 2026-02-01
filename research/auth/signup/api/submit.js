// js/signup/api/submit.js
import { buttons, currentStepId, uiRefs } from "../core/state.js";
import { validateStep } from "../logic/validate.js";
import { readFormIntoState } from "../data/formState.js";
import { clearDraft } from "../data/draft.js";
import { setMessage } from "../ui/messages.js";

export function sanitizePayload(d) {
  const copy = { ...d };
  delete copy.confirmPassword;
  delete copy.providerConfirm;
  return copy;
}

export async function submitSignup(e) {
  e.preventDefault();

  const stepId = currentStepId();
  const ok = validateStep(stepId);
  if (!ok) return;

  readFormIntoState();

  const payload = {
    role: uiRefs.state.role,
    ...sanitizePayload(uiRefs.state.data)
  };

  const SIGNUP_ENDPOINT = "/api/signup";

  buttons.btnSubmit.disabled = true;
  setMessage("Creating your account...");

  try {
    const res = await fetch(SIGNUP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Signup failed (${res.status})`);
    }

    clearDraft();
    setMessage("Account created successfully. Redirecting...");
    setTimeout(() => (window.location.href = "/login.html"), 700);

  } catch (err) {
    setMessage(err?.message || "Something went wrong. Please try again.");
  } finally {
    buttons.btnSubmit.disabled = false;
  }
}
