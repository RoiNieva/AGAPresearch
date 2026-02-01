import { K } from "./storage.js";
import { byId } from "./dom.js";

export function applyTheme() {
  const t = localStorage.getItem(K.theme) || "light";
  document.body.classList.toggle("dark", t === "dark");

  const logo = byId("siteLogo");
  if (logo) {
    logo.src = t === "dark"
      ? "assets/logo/logo-dark.png"
      : "assets/logo/logo-light.png";
  }
}

export function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem(K.theme, isDark ? "light" : "dark");
  applyTheme();
}
