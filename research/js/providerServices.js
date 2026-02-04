import { byId } from "./dom.js";
import { state, SERVICE_CATALOG } from "./state.js";
import { escapeHTML } from "./utils.js";


export function initProviderServicePickers() {
  const catSel = byId("provider-category");
  const svcSel = byId("provider-service");
  if (!catSel || !svcSel) return;

  const categories = Object.keys(SERVICE_CATALOG || {});
  catSel.innerHTML = `<option value="" disabled selected>Select a category</option>` +
    categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");

  catSel.addEventListener("change", () => {
    const cat = catSel.value;
    const services = (SERVICE_CATALOG && SERVICE_CATALOG[cat]) ? SERVICE_CATALOG[cat] : [];
    svcSel.innerHTML = `<option value="" disabled selected>Select a service</option>` +
      services.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
  });

 
  if (catSel.value) catSel.dispatchEvent(new Event("change"));

 
  renderProviderServicesList();
}


export function addProviderService() {
  const category = byId("provider-category")?.value || "";
  const service = byId("provider-service")?.value || "";
  if (!category || !service) return alert("Select a category and a service.");

  const exists = (state.providerSelectedServices || []).some(
    s => s.category === category && s.service === service
  );
  if (exists) return alert("Already added.");

  state.providerSelectedServices.push({ category, service });

  renderProviderServicesList();


}


export function removeProviderService(index) {
  const idx = Number(index);
  if (!Number.isFinite(idx)) return;

  if (!Array.isArray(state.providerSelectedServices)) state.providerSelectedServices = [];
  if (idx < 0 || idx >= state.providerSelectedServices.length) return;

  state.providerSelectedServices.splice(idx, 1);
  renderProviderServicesList();
}

export function clearProviderSelectedServices() {
  state.providerSelectedServices = [];
  renderProviderServicesList();
}


export function renderProviderServicesList() {
  const wrap = byId("provider-services-list");
  if (!wrap) return;

  const list = Array.isArray(state.providerSelectedServices) ? state.providerSelectedServices : [];
  if (list.length === 0) {
    wrap.innerHTML = `<p class="hint">No services added yet.</p>`;
    return;
  }

  wrap.innerHTML = list.map((s, idx) => `
    <span class="chip" style="display:inline-flex; align-items:center; gap:8px; margin:4px;">
      <span>${escapeHTML(s.category)} — <b>${escapeHTML(s.service)}</b></span>
      <button
        type="button"
        class="chip-x"
        data-provider-selected-remove="${idx}"
        aria-label="Remove service">✕</button>
    </span>
  `).join("");
}


export function installProviderServicesDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-provider-selected-remove]");
    if (!el) return;

    const idx = el.dataset.providerSelectedRemove;
    e.preventDefault();
    e.stopPropagation();
    removeProviderService(idx);
  }, true);
}
