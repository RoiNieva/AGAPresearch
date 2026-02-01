// js/signup/signup.js
import { $ } from "./core/dom.js";
import { form, buttons, uiRefs } from "./core/state.js";
import { showStep } from "./ui/view.js";
import { goNext, goBack } from "./logic/navigation.js";
import { saveDraft, loadDraft, clearDraft } from "./data/draft.js";
import { submitSignup } from "./api/submit.js";
import { readFormIntoState } from "./data/formState.js";
import { toggleTheme } from "../../js/theme.js";  

$("#year").textContent = new Date().getFullYear().toString();

// Events
buttons.btnNext.addEventListener("click", goNext);
buttons.btnBack.addEventListener("click", goBack);
buttons.btnSaveDraft.addEventListener("click", saveDraft);
buttons.btnLoadDraft.addEventListener("click", loadDraft);
buttons.btnClearDraft.addEventListener("click", clearDraft);

form.addEventListener("submit", submitSignup);

// If user changes role, reflect in state immediately
document.querySelectorAll('input[name="role"]').forEach(r => {
  r.addEventListener("change", () => {
    readFormIntoState();
    uiRefs.state.stepIndex = 0;
    showStep("role");
  });
});
export function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem(K.theme, isDark ? "light" : "dark");
  applyTheme();
}

// Init
showStep("role");
