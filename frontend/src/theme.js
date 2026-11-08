import "./styles/theme.css";

const KEY = "FLEXER_theme";

export function mountTheme() {
  // Enforce white (light) theme permanently across the entire application
  document.documentElement.dataset.theme = "light";
  try {
    localStorage.removeItem(KEY);
    localStorage.setItem(KEY, "light");
  } catch {}

  // Remove any dark/white toggle switch elements
  document
    .querySelectorAll("[data-theme-toggle], .theme-toggle")
    .forEach((button) => button.remove());
}
