// js/signup/data/formState.js
import { $, $$ } from "../core/dom.js";
import { form, uiRefs } from "../core/state.js";

export function readFormIntoState() {
  const role = form.role?.value || null;
  if (role) uiRefs.state.role = role;

  const data = uiRefs.state.data;

  data.email = $("#email")?.value?.trim() || "";
  data.password = $("#password")?.value || "";
  data.confirmPassword = $("#confirmPassword")?.value || "";

  data.fullName = $("#fullName")?.value?.trim() || "";
  data.phone = $("#phone")?.value?.trim() || "";
  data.address = $("#address")?.value?.trim() || "";

  data.category = $("#category")?.value || "";
  data.experienceYears = $("#experienceYears")?.value || "";
  data.bio = $("#bio")?.value?.trim() || "";

  data.govId = $("#govId")?.value?.trim() || "";
  data.portfolioUrl = $("#portfolioUrl")?.value?.trim() || "";
  data.certNotes = $("#certNotes")?.value?.trim() || "";

  data.days = $$('input[name="days"]:checked').map(i => i.value);
  data.timeFrom = $("#timeFrom")?.value || "";
  data.timeTo = $("#timeTo")?.value || "";

  data.providerConfirm = $("#providerConfirm")?.checked || false;

  uiRefs.state.data = data;
}

export function hydrateFormFromState() {
  const d = uiRefs.state.data || {};

  if (uiRefs.state.role) {
    const radio = form.querySelector(`input[name="role"][value="${uiRefs.state.role}"]`);
    if (radio) radio.checked = true;
  }

  const set = (id, v) => { const el = $(id); if (el) el.value = v ?? ""; };

  set("#email", d.email);
  set("#password", d.password);
  set("#confirmPassword", d.confirmPassword);

  set("#fullName", d.fullName);
  set("#phone", d.phone);
  set("#address", d.address);

  set("#category", d.category);
  set("#experienceYears", d.experienceYears);
  set("#bio", d.bio);

  set("#govId", d.govId);
  set("#portfolioUrl", d.portfolioUrl);
  set("#certNotes", d.certNotes);

  $$('input[name="days"]').forEach(i => i.checked = (d.days || []).includes(i.value));
  set("#timeFrom", d.timeFrom);
  set("#timeTo", d.timeTo);

  const pc = $("#providerConfirm");
  if (pc) pc.checked = !!d.providerConfirm;
}
