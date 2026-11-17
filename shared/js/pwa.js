/**
 * pwa.js — install prompt, iOS guidance and install state.
 * Works with the generated manifest.webmanifest and sw.js.
 */
import { t } from "./i18n.js";
import { toast } from "./ui.js";

const DISMISS_KEY = "wx.pwaDismissed";
let deferred = null;
let banner = null;
let headerBtn = null;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function dismissedRecently() {
  try {
    const raw = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Boolean(raw) && Date.now() - raw < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

function show() {
  if (banner) banner.hidden = false;
  if (headerBtn) headerBtn.hidden = false;
}

function hide() {
  if (banner) banner.hidden = true;
}

async function install() {
  if (deferred) {
    try {
      deferred.prompt();
      const choice = await deferred.userChoice;
      deferred = null;
      hide();
      if (choice?.outcome === "accepted") toast(t("pwa.installed"), { type: "success", duration: 5000 });
    } catch {
      deferred = null;
    }
    return;
  }
  if (isIos()) {
    toast(`${t("pwa.iosTitle")} — ${t("pwa.iosBody")}`, { duration: 8000 });
    return;
  }
  toast(t("pwa.iosBody"), { duration: 6000 });
}

export function initPwa() {
  if (isStandalone()) return;
  banner = document.getElementById("install-banner");
  headerBtn = document.getElementById("btn-install");
  if (!banner || !headerBtn) return;

  document.getElementById("btn-install-go")?.addEventListener("click", install);
  document.getElementById("btn-install-close")?.addEventListener("click", () => {
    markDismissed();
    hide();
  });
  headerBtn.addEventListener("click", install);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    if (!dismissedRecently()) show();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    hide();
    toast(t("pwa.installed"), { type: "success", duration: 5000 });
  });

  // iOS Safari does not fire beforeinstallprompt — offer guidance after a short delay.
  if (isIos() && !dismissedRecently()) setTimeout(show, 2500);
}
