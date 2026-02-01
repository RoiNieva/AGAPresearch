import { val, byId } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, setSession } from "./storage.js";
import { makeId } from "./utils.js";
import { updateNav, updateBell } from "./nav.js";
import { showPage, goHome } from "./routing.js";

async function hashPassword(password) {
  let h = 5381;
  for (let i=0; i<password.length; i++) h = ((h << 5) + h) + password.charCodeAt(i);
  return "h_" + (h >>> 0).toString(16);
}

export async function clientSignUp() {
  const name = val("client-signup-name");
  const email = val("client-signup-email").toLowerCase();
  const pass = val("client-signup-password");
  const pass2 = val("client-signup-password2");
  if (!name || !email || !pass || !pass2) return alert("Fill all fields.");
  if (pass !== pass2) return alert("Passwords do not match.");
  if (state.clients.some(c => c.email === email)) return alert("Email exists.");

  const client = { id: makeId(), name, email, passHash: await hashPassword(pass), createdAt: Date.now() };
  state.clients.push(client);
  saveArray(K.clients, state.clients);

  setSession({ role:"client", id: client.id });
  updateNav(); updateBell();
  goHome();
}

export async function clientSignIn() {
  const email = val("client-login-email").toLowerCase();
  const pass = val("client-login-password");
  if (!email || !pass) return alert("Enter email and password.");

  if (email === "admin@agap.com" && pass === "admin123") {
    setSession({ role:"admin", id:"admin" });
    updateNav(); updateBell();
    return showPage("admin-page");
  }

  const c = state.clients.find(x => x.email === email);
  if (!c) return alert("Account not found.");

  if ((await hashPassword(pass)) !== c.passHash) return alert("Wrong password.");
  setSession({ role:"client", id: c.id });
  updateNav(); updateBell();
  goHome();
}

export async function providerSignUp() {
  const email = val("pro-signup-email").toLowerCase();
  const pass = val("pro-signup-password");
  const pass2 = val("pro-signup-password2");
  if (!email || !pass || !pass2) return alert("Fill account fields.");
  if (pass !== pass2) return alert("Passwords do not match.");
  if (state.providers.some(p => p.email === email)) return alert("Provider exists.");

  const name = val("pro-name");
  const city = val("pro-city");
  const date = byId("pro-date").value;
  const time = val("pro-time");
  if (!name || !city || !date || !time) return alert("Fill profile details.");
  if (!state.providerSelectedServices.length) return alert("Add at least 1 service.");
  if (!byId("pro-confirm")?.checked) return alert("Please confirm your details first.");


  const provider = {
    id: makeId(),
    email,
    passHash: await hashPassword(pass),
    profile: { name, city, date, time, phone: val("pro-phone"), messenger: val("pro-messenger") },
    services: [...state.providerSelectedServices],
    serviceRadiusKm: Number(byId("pro-radius").value || 10),
    pricing: { type: byId("pro-price-type").value, amount: Number(byId("pro-price-amount").value || 0), currency: "PHP" },
    verified: false,
    featured: false,
    subscription: { plan:"Free", active:true },
    createdAt: Date.now()
  };

  state.providers.push(provider);
  saveArray(K.providers, state.providers);
  setSession({ role:"provider", id: provider.id });
  updateNav(); updateBell();
  showPage("provider-dashboard");
}

export async function providerSignIn() {
  const email = val("pro-login-email").toLowerCase();
  const pass = val("pro-login-password");
  if (!email || !pass) return alert("Enter email and password.");

  const p = state.providers.find(x => x.email === email);
  if (!p) return alert("Provider not found.");
  if ((await hashPassword(pass)) !== p.passHash) return alert("Wrong password.");

  setSession({ role:"provider", id: p.id });
  updateNav(); updateBell();
  showPage("provider-dashboard");
}

export function logout() {
  localStorage.removeItem(K.session);
  updateNav(); updateBell();
  goHome();
}
