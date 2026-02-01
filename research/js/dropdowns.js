import { byId } from "./dom.js";
import { state } from "./state.js";

export function populateCategoryDropdown(selectId, includeAny = false) {
  const sel = byId(selectId);
  if (!sel) return;

  sel.innerHTML = "";

  if (includeAny) {
    const optAny = document.createElement("option");
    optAny.value = "";
    optAny.textContent = "All Categories";
    sel.appendChild(optAny);
  }

  for (const cat of Object.keys(state.SERVICE_CATALOG)) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  }

  if (!includeAny) sel.value = Object.keys(state.SERVICE_CATALOG)[0] || "";
}

export function populateServiceDropdown(categorySelectId, serviceSelectId, includeAny = false) {
  const catSel = byId(categorySelectId);
  const svcSel = byId(serviceSelectId);
  if (!catSel || !svcSel) return;

  const cat = catSel.value;
  svcSel.innerHTML = "";

  if (includeAny) {
    const optAny = document.createElement("option");
    optAny.value = "";
    optAny.textContent = "All Services";
    svcSel.appendChild(optAny);
  }

  if (!cat) return;

  (state.SERVICE_CATALOG[cat] || []).forEach(service => {
    const opt = document.createElement("option");
    opt.value = service;
    opt.textContent = service;
    svcSel.appendChild(opt);
  });

  if (!includeAny) svcSel.value = (state.SERVICE_CATALOG[cat] || [])[0] || "";
}
