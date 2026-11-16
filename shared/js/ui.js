/**
 * ui.js — DOM helpers, toasts, dialogs, tabs, sheet, share/copy, rain canvas.
 */
import { icon } from "./icons.js";
import { t } from "./i18n.js";

export function $(sel, root = document) {
  return root.querySelector(sel);
}
export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function on(el, event, handler, opts) {
  if (!el) return;
  el.addEventListener(event, handler, opts);
}

export function setText(el, value) {
  if (el) el.textContent = value == null ? "" : String(value);
}

export function setHTML(el, html) {
  if (el) el.innerHTML = html == null ? "" : String(html);
}

export function toggle(el, show) {
  if (!el) return;
  el.hidden = !show;
}

/* ------------------------------------------------------------------- toast */
let toastRoot = null;
function ensureToastRoot() {
  if (toastRoot && document.body.contains(toastRoot)) return toastRoot;
  toastRoot = document.querySelector(".toast-stack");
  if (!toastRoot) {
    toastRoot = document.createElement("div");
    toastRoot.className = "toast-stack";
    toastRoot.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRoot);
  }
  return toastRoot;
}

export function toast(message, opts = {}) {
  const root = ensureToastRoot();
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("data-type", opts.type || "info");
  const iconName = opts.type === "error" ? "alert" : opts.type === "success" ? "check" : "info";
  el.innerHTML = `${icon(iconName, { size: "sm" })}<span>${escapeHtml(String(message))}</span>`;
  root.appendChild(el);
  const ms = opts.duration ?? 3200;
  const remove = () => {
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 200);
  };
  setTimeout(remove, ms);
  return { remove };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ dialog */
export function openDialog(idOrEl) {
  const dlg = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (dlg && typeof dlg.showModal === "function") {
    try { dlg.showModal(); } catch { dlg.setAttribute("open", ""); }
  } else if (dlg) {
    dlg.setAttribute("open", "");
  }
}

export function closeDialog(idOrEl) {
  const dlg = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (dlg && typeof dlg.close === "function") {
    try { dlg.close(); } catch { dlg.removeAttribute("open"); }
  } else if (dlg) {
    dlg.removeAttribute("open");
  }
}

export function bindDialog(dlg) {
  if (!dlg) return;
  dlg.querySelectorAll("[data-close-dialog]").forEach((btn) => on(btn, "click", () => closeDialog(dlg)));
  on(dlg, "click", (e) => {
    const rect = dlg.getBoundingClientRect();
    if (e.target === dlg && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      closeDialog(dlg);
    }
  });
}

/* -------------------------------------------------------------------- tabs */
export function initTabs(root = document) {
  $$(".tabs", root).forEach((group) => {
    const tabs = $$('[role="tab"], .tab', group);
    tabs.forEach((tab) => {
      on(tab, "click", () => activateTab(tab, group));
      on(tab, "keydown", (e) => {
        const idx = tabs.indexOf(tab);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const next = tabs[(idx + dir + tabs.length) % tabs.length];
          next.focus();
          activateTab(next, group);
        }
      });
    });
  });
}

export function activateTab(tab, group) {
  const tabs = $$('[role="tab"], .tab', group || tab.closest(".tabs") || document);
  const targetId = tab.getAttribute("data-tab") || tab.getAttribute("aria-controls");
  tabs.forEach((t) => {
    const active = t === tab;
    t.setAttribute("aria-selected", active ? "true" : "false");
    t.tabIndex = active ? 0 : -1;
  });
  if (targetId) {
    const panelRoot = group ? group.parentElement : document;
    $$("[data-tab-panel], .tab-panel", panelRoot).forEach((p) => {
      const id = p.getAttribute("data-tab-panel") || p.id;
      const active = id === targetId;
      p.classList.toggle("is-active", active);
      p.hidden = !active;
      if (active) p.setAttribute("aria-hidden", "false");
      else p.setAttribute("aria-hidden", "true");
    });
  }
  tab.dispatchEvent(new CustomEvent("wx:tab", { bubbles: true, detail: { id: targetId } }));
}

/* ------------------------------------------------------------------- sheet */
export function openSheet(sheet) {
  const el = typeof sheet === "string" ? document.getElementById(sheet) : sheet;
  if (!el) return;
  el.setAttribute("data-open", "true");
  el.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
export function closeSheet(sheet) {
  const el = typeof sheet === "string" ? document.getElementById(sheet) : sheet;
  if (!el) return;
  el.setAttribute("data-open", "false");
  el.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
export function bindSheet(sheet) {
  const el = typeof sheet === "string" ? document.getElementById(sheet) : sheet;
  if (!el) return;
  el.querySelectorAll("[data-close-sheet], .sheet-backdrop").forEach((b) => on(b, "click", () => closeSheet(el)));
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && el.getAttribute("data-open") === "true") closeSheet(el);
  });
}

/* --------------------------------------------------------------- share/copy */
export async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(t("action.copied"), { type: "success" });
    return true;
  } catch {
    toast(t("error.title"), { type: "error" });
    return false;
  }
}

export async function sharePage(data = {}) {
  const payload = {
    title: data.title || document.title,
    text: data.text || "",
    url: data.url || location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return true;
    }
  } catch {
    /* fall through to copy */
  }
  return copyText(payload.url);
}

/* -------------------------------------------------------------- rain canvas */
export function startRain(canvas, opts = {}) {
  if (!canvas || typeof canvas.getContext !== "function") return { stop() {} };
  const ctx = canvas.getContext("2d");
  if (!ctx) return { stop() {} };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let drops = [];
  let raf = 0;
  let running = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width * dpr));
    h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = w;
    canvas.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeDrops() {
    const count = Math.round(Math.min(120, (canvas.clientWidth || 400) / 8));
    drops = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.clientWidth || 400),
      y: Math.random() * (canvas.clientHeight || 300),
      l: 8 + Math.random() * 14,
      s: 2 + Math.random() * 3.5,
      a: 0.08 + Math.random() * 0.18,
    }));
  }

  function draw() {
    if (!running) return;
    const cw = canvas.clientWidth || w / dpr;
    const ch = canvas.clientHeight || h / dpr;
    ctx.clearRect(0, 0, cw, ch);
    ctx.strokeStyle = opts.color || "rgba(120,170,255,0.35)";
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    for (const d of drops) {
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.l * 0.18, d.y + d.l);
      ctx.stroke();
      d.y += d.s * (opts.speed || 1);
      d.x -= d.s * 0.12;
      if (d.y > ch + 20) {
        d.y = -20;
        d.x = Math.random() * cw;
      }
      if (d.x < -20) d.x = cw + 20;
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }

  resize();
  makeDrops();
  raf = requestAnimationFrame(draw);
  window.addEventListener("resize", resize);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

/* ------------------------------------------------------------ small helpers */
export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function formatUpdated(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
