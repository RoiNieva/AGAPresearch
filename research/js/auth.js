// js/auth.js
import { val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, setSession } from "./storage.js";
import { makeId } from "./utils.js";
import { updateNav, updateBell } from "./nav.js";
import { showPage, goHome } from "./routing.js";

async function hashPassword(password) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = ((h << 5) + h) + password.charCodeAt(i);
  return "h_" + (h >>> 0).toString(16);
}

function redirectAfterAuthOrHome() {
  const target = window.__redirectAfterAuth;
  if (target) {
    window.__redirectAfterAuth = null;
    return showPage(target);
  }
  goHome();
}

/* ---------------------------
   Existing (old) forms (kept)
---------------------------- */
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

  setSession({ role: "client", id: client.id });
  updateNav(); updateBell();
  redirectAfterAuthOrHome();
}

export async function clientSignIn() {
  const email = val("client-login-email").toLowerCase();
  const pass = val("client-login-password");
  if (!email || !pass) return alert("Enter email and password.");

  if (email === "admin@agap.com" && pass === "admin123") {
    setSession({ role: "admin", id: "admin" });
    updateNav(); updateBell();
    return showPage("admin-page");
  }

  const c = state.clients.find(x => x.email === email);
  if (!c) return alert("Account not found.");
  if ((await hashPassword(pass)) !== c.passHash) return alert("Wrong password.");

  setSession({ role: "client", id: c.id });
  updateNav(); updateBell();
  redirectAfterAuthOrHome();
}

export async function providerSignIn() {
  const email = val("pro-login-email").toLowerCase();
  const pass = val("pro-login-password");
  if (!email || !pass) return alert("Enter email and password.");

  const p = state.providers.find(x => x.email === email);
  if (!p) return alert("Provider not found.");
  if ((await hashPassword(pass)) !== p.passHash) return alert("Wrong password.");

  setSession({ role: "provider", id: p.id });
  updateNav(); updateBell();
  redirectAfterAuthOrHome();
}

/* ---------------------------
   NEW: Unified Sign In page
---------------------------- */
function getSelectedRadio(name) {
  return document.querySelector(`input[name="${CSS.escape(name)}"]:checked`)?.value || "";
}

export async function unifiedSignIn() {
  const email = (document.getElementById("auth-login-email")?.value || "").trim().toLowerCase();
  const pass = document.getElementById("auth-login-password")?.value || "";
  const role = getSelectedRadio("auth-login-role");

  if (!email || !pass) return alert("Enter email and password.");

  // admin shortcut
  if (email === "admin@agap.com" && pass === "admin123") {
    setSession({ role: "admin", id: "admin" });
    updateNav(); updateBell();
    return redirectAfterAuthOrHome();
  }

  if (role === "provider") {
    const p = state.providers.find(x => x.email === email);
    if (!p) return alert("Provider not found.");
    if ((await hashPassword(pass)) !== p.passHash) return alert("Wrong password.");

    setSession({ role: "provider", id: p.id });
    updateNav(); updateBell();
    return redirectAfterAuthOrHome();
  }

  // default client
  const c = state.clients.find(x => x.email === email);
  if (!c) return alert("Client account not found.");
  if ((await hashPassword(pass)) !== c.passHash) return alert("Wrong password.");

  setSession({ role: "client", id: c.id });
  updateNav(); updateBell();
  return redirectAfterAuthOrHome();
}

/* ---------------------------
   NEW: Unified Client Sign Up
---------------------------- */
export async function unifiedClientSignUp() {
  const name = (document.getElementById("auth-signup-name")?.value || "").trim();
  const email = (document.getElementById("auth-signup-email")?.value || "").trim().toLowerCase();
  const pass = document.getElementById("auth-signup-password")?.value || "";
  const pass2 = document.getElementById("auth-signup-password2")?.value || "";

  if (!name || !email || !pass || !pass2) return alert("Fill all fields.");
  if (pass.length < 8) return alert("Password must be at least 8 characters.");
  if (pass !== pass2) return alert("Passwords do not match.");
  if (state.clients.some(c => c.email === email)) return alert("Email exists.");

  const client = { id: makeId(), name, email, passHash: await hashPassword(pass), createdAt: Date.now() };
  state.clients.push(client);
  saveArray(K.clients, state.clients);

  setSession({ role: "client", id: client.id });
  updateNav(); updateBell();
  redirectAfterAuthOrHome();
}

export function logout() {
  localStorage.removeItem(K.session);
  updateNav(); updateBell();
  goHome();
}
