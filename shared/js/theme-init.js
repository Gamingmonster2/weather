/* classic script — runs synchronously in <head> to avoid a theme flash */
(function () {
  var root = document.documentElement;
  var brand = root.getAttribute("data-brand") || "rain";
  var fallback = brand === "rain" ? "dark" : "light";
  var stored = null;

  try {
    stored = localStorage.getItem("wx.theme");
  } catch (e) {
    stored = null;
  }

  var prefersDark = false;
  try {
    prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    prefersDark = false;
  }

  var theme;
  if (stored === "light" || stored === "dark") theme = stored;
  else if (stored === "system") theme = prefersDark ? "dark" : "light";
  else theme = fallback;

  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
})();
