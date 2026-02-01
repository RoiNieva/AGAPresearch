// js/signup/ui/messages.js
import { $$ } from "../core/dom.js";
import { uiRefs } from "../core/state.js";

export function setMessage(text, kind = "") {
  uiRefs.msg.textContent = text || "";
  uiRefs.msg.dataset.kind = kind;
}

export function setError(name, text) {
  const el = document.querySelector(`[data-error-for="${CSS.escape(name)}"]`);
  if (el) el.textContent = text || "";
}

export function clearAllErrors() {
  $$("[data-error-for]").forEach(e => (e.textContent = ""));
}
