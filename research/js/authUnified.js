// js/authUnified.js
import { byId, val } from "./dom.js";
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

function getCheckedRole(name) {
  return document.querySelector(`input[name="${CSS.escape(name)}"]:checked`)?.value || "";
}

export function initAuthUnifiedUI() {
  // Toggle signup boxes based on role selection
  const radios = [...document.querySelectorAll('input[name="auth-signup-role"]')];
  const clientBox = byId("client-signup-box");
  const providerBox = byId("provider-signup-box");

  function sync() {
    const role = getCheckedRole("auth-signup-role");
    if (!clientBox || !providerBox) return;
    clientBox.classList.toggle("hidden", role !== "client");
    providerBox.classList.toggle("hidden", role !== "provider");
  }

  radios.forEach(r => r.addEventListener("change", sync));
  sync();
}

/* -------------------------
   Unified SIGN IN
-------------------------- */
export async function authUnifiedSignIn() {
  const email = val("auth-login-email").toLowerCase();
  const pass = byId("auth-login-password")?.value || "";
  const role = getCheckedRole("auth-login-role");

  if (!email || !pass) return alert("Enter email and password.");
  if (!role) return alert("Choose a role.");

  // Admin demo stays (optional)
  if (email === "admin@agap.com" && pass === "admin123") {
    setSession({ role: "admin", id: "admin" });
    updateNav(); updateBell();
    return showPage("admin-page");
  }

  if (role === "client") {
    const c = state.clients.find(x => x.email === email);
    if (!c) return alert("Client account not found.");
    if ((await hashPassword(pass)) !== c.passHash) return alert("Wrong password.");

    setSession({ role:"client", id: c.id });
    updateNav(); updateBell();
    return goHome();
  }

  if (role === "provider") {
    const p = state.providers.find(x => x.email === email);
    if (!p) return alert("Provider account not found.");
    if ((await hashPassword(pass)) !== p.passHash) return alert("Wrong password.");

    setSession({ role:"provider", id: p.id });
    updateNav(); updateBell();
    return showPage("provider-dashboard");
  }

  alert("Invalid role.");
}

/* -------------------------
   Unified SIGN UP (Client)
-------------------------- */
export async function authUnifiedClientSignUp() {
  const role = getCheckedRole("auth-signup-role");
  if (role !== "client") return alert("Choose Client to create client account here.");

  const name = val("auth-signup-name");
  const email = val("auth-signup-email").toLowerCase();
  const pass = byId("auth-signup-password")?.value || "";
  const pass2 = byId("auth-signup-password2")?.value || "";

  if (!name || !email || !pass || !pass2) return alert("Fill all fields.");
  if (pass !== pass2) return alert("Passwords do not match.");
  if (state.clients.some(c => c.email === email)) return alert("Email already exists.");

  const client = { id: makeId(), name, email, passHash: await hashPassword(pass), createdAt: Date.now() };
  state.clients.push(client);
  saveArray(K.clients, state.clients);

  setSession({ role:"client", id: client.id });
  updateNav(); updateBell();
  goHome();
}

/* -------------------------
   Unified SIGN UP (Provider)
-------------------------- */
export function authUnifiedStartProviderSignup() {
  const role = getCheckedRole("auth-signup-role");
  if (role !== "provider") return alert("Choose Provider first.");
  showPage("provider-signup");
}
