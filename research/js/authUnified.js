import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, setSession } from "./storage.js";
import { makeId } from "./utils.js";
import { updateNav, updateBell } from "./nav.js";
import { showPage } from "./routing.js";
import { showToast } from "./ui.js";

async function hashPassword(password) {
  let h = 5381;
  for (let i=0; i<password.length; i++) h = ((h << 5) + h) + password.charCodeAt(i);
  return "h_" + (h >>> 0).toString(16);
}

function getCheckedRole(name) {
  return document.querySelector(`input[name="${CSS.escape(name)}"]:checked`)?.value || "";
}

export function initAuthUnifiedUI() {
  const radios = [...document.querySelectorAll('input[name="auth-signup-role"]')];
  const clientBox = byId("auth-signup-client");
  const providerBox = byId("auth-signup-provider");

  function sync() {
    const role = getCheckedRole("auth-signup-role");
    if (!clientBox || !providerBox) return;
    clientBox.classList.toggle("hidden", role !== "client");
    providerBox.classList.toggle("hidden", role !== "provider");
  }

  radios.forEach(r => r.addEventListener("change", sync));
  sync();
}

/* ✨ FIXED: Smooth animation + direct dashboard redirect */
export async function authUnifiedSignIn() {
  const email = val("auth-login-email").toLowerCase().trim();
  const pass = byId("auth-login-password")?.value || "";
  const role = getCheckedRole("auth-login-role");

  // Validation
  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email.", "error");
    return;
  }
  if (!pass) {
    showToast("Please enter your password.", "error");
    return;
  }
  if (!role) {
    showToast("Please select a role.", "error");
    return;
  }

  // Admin demo
  if (email === "admin@agap.com" && pass === "admin123") {
    animateAuthSuccess(() => {
      setSession({ role: "admin", id: "admin" });
      updateNav(); updateBell();
      showPage("admin-page");
    });
    return;
  }

  if (role === "client") {
    const c = state.clients.find(x => x.email === email);
    if (!c) {
      showToast("Client account not found.", "error");
      return;
    }
    if ((await hashPassword(pass)) !== c.passHash) {
      showToast("Wrong password.", "error");
      return;
    }

    animateAuthSuccess(() => {
      setSession({ role: "client", id: c.id });
      updateNav(); updateBell();
      showPage("client-dashboard");
    });
    return;
  }

  if (role === "provider") {
    const p = state.providers.find(x => x.email === email);
    if (!p) {
      showToast("Provider account not found.", "error");
      return;
    }
    if ((await hashPassword(pass)) !== p.passHash) {
      showToast("Wrong password.", "error");
      return;
    }

    animateAuthSuccess(() => {
      setSession({ role: "provider", id: p.id });
      updateNav(); updateBell();
      showPage("provider-dashboard");
    });
    return;
  }
}

/* ✨ FIXED: Smooth animation + direct dashboard redirect */
export async function authUnifiedClientSignUp() {
  const role = getCheckedRole("auth-signup-role");
  if (role !== "client") {
    showToast("Select 'Client' for this form.", "error");
    return;
  }

  const name = val("auth-signup-name").trim();
  const email = val("auth-signup-email").toLowerCase().trim();
  const pass = byId("auth-signup-password")?.value || "";
  const pass2 = byId("auth-signup-password2")?.value || "";

  if (!name) {
    showToast("Please enter your name.", "error");
    return;
  }
  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email.", "error");
    return;
  }
  if (!pass || pass.length < 6) {
    showToast("Password must be 6+ characters.", "error");
    return;
  }
  if (pass !== pass2) {
    showToast("Passwords do not match.", "error");
    return;
  }
  if (state.clients.some(c => c.email === email)) {
    showToast("Email already exists.", "error");
    return;
  }

  const client = {
    id: makeId(),
    name,
    email,
    passHash: await hashPassword(pass),
    createdAt: Date.now()
  };

  state.clients.push(client);
  saveArray(K.clients, state.clients);

  animateAuthSuccess(() => {
    setSession({ role: "client", id: client.id });
    updateNav(); updateBell();
    showPage("client-dashboard");
  });
}

export function authUnifiedStartProviderSignup() {
  const role = getCheckedRole("auth-signup-role");
  if (role !== "provider") {
    showToast("Select 'Provider' first.", "error");
    return;
  }
  showPage("provider-signup");
}

/* ✨ Smooth transition animation */
function animateAuthSuccess(callback) {
  const overlay = document.createElement("div");
  overlay.className = "auth-success-overlay";
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.classList.add("active");
  }, 10);
  
  setTimeout(() => {
    callback();
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 300);
  }, 400);
}
