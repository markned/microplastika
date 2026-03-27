(function () {
  "use strict";

  var L = window.MicroplastikaLayout;
  if (!L) {
    console.error("layout-core.js must load before layout-editor.js");
    return;
  }

  var STORAGE_KEY = "microplastika-layout-v3";
  var KEYS = L.KEYS;

  function loadState() {
    var stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      stored = {};
    }
    var base =
      typeof window.__MICROPLASTIKA_LAYOUT__ === "object" && window.__MICROPLASTIKA_LAYOUT__ !== null
        ? window.__MICROPLASTIKA_LAYOUT__
        : {};
    return Object.assign({}, base, stored);
  }

  function saveState(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  var editing = false;
  var active = null;
  var startPointer = { x: 0, y: 0 };
  var startT = null;
  var selectedWrap = null;
  var panelEl = null;

  function setEditing(on) {
    editing = on;
    document.body.classList.toggle("layout-edit-mode", on);
    var primary = document.querySelector("[data-layout-action='toggle']");
    var hint = document.querySelector(".layout-editor-panel__hint");
    var selBox = document.querySelector(".layout-editor-panel__transform");
    if (primary) {
      primary.textContent = on ? "Сохранить и зафиксировать" : "Редактировать макет";
      primary.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (hint) hint.hidden = !on;
    if (selBox) selBox.hidden = !on || !selectedWrap;
    if (!on) {
      selectedWrap = null;
      document.querySelectorAll(".layout-asset--selected").forEach(function (el) {
        el.classList.remove("layout-asset--selected");
      });
    }
  }

  function syncPanelFromWrap(wrap) {
    if (!panelEl || !wrap) return;
    var t = L.readFromWrap(wrap);
    KEYS.forEach(function (key) {
      panelEl.querySelectorAll('[data-tkey="' + key + '"]').forEach(function (inp) {
        inp.value = String(t[key]);
      });
    });
  }

  function setSelected(wrap) {
    document.querySelectorAll(".layout-asset--selected").forEach(function (el) {
      el.classList.remove("layout-asset--selected");
    });
    selectedWrap = wrap || null;
    if (wrap) {
      wrap.classList.add("layout-asset--selected");
      syncPanelFromWrap(wrap);
    }
    var selBox = document.querySelector(".layout-editor-panel__transform");
    if (selBox) selBox.hidden = !editing || !selectedWrap;
  }

  function onPointerDown(e) {
    if (!editing) return;
    var t = e.target;
    if (t.tagName !== "IMG" || !t.src || t.src.indexOf("assets/img") === -1) return;
    var root = L.getLayoutRoot(t);
    if (!root) return;
    setSelected(root);
    e.preventDefault();
    active = root;
    root.setPointerCapture(e.pointerId);
    startPointer = { x: e.clientX, y: e.clientY };
    startT = L.readFromWrap(root);
    root.classList.add("layout-dragging");
  }

  function onPointerMove(e) {
    if (!editing || !active) return;
    var dx = e.clientX - startPointer.x;
    var dy = e.clientY - startPointer.y;
    var nt = Object.assign({}, startT);
    nt.tx = startT.tx + dx;
    nt.ty = startT.ty + dy;
    L.applyToWrap(active, nt);
    syncPanelFromWrap(active);
  }

  function onPointerUp(e) {
    if (active) {
      try {
        active.releasePointerCapture(e.pointerId);
      } catch (_) {}
      active.classList.remove("layout-dragging");
      active = null;
      startT = null;
    }
  }

  function onWheel(e) {
    if (!editing) return;
    var root = L.getLayoutRoot(e.target);
    if (!root) return;
    e.preventDefault();
    setSelected(root);
    var tr = L.readFromWrap(root);
    var d = e.deltaY;
    if (e.shiftKey) {
      tr.r -= d * 0.15;
    } else if (e.altKey) {
      tr.kx -= d * 0.08;
      tr.ky -= d * 0.05;
    } else {
      var factor = d > 0 ? 0.94 : 1.06;
      tr.sx *= factor;
      tr.sy *= factor;
      tr.sx = Math.min(4, Math.max(0.05, tr.sx));
      tr.sy = Math.min(4, Math.max(0.05, tr.sy));
    }
    L.applyToWrap(root, tr);
    syncPanelFromWrap(root);
  }

  function onPanelInput(e) {
    var inp = e.target;
    if (!inp.hasAttribute("data-tkey") || !selectedWrap) return;
    var key = inp.getAttribute("data-tkey");
    var v = parseFloat(inp.value);
    if (isNaN(v)) return;
    var t = L.readFromWrap(selectedWrap);
    t[key] = v;
    L.applyToWrap(selectedWrap, t);
    panelEl.querySelectorAll('[data-tkey="' + key + '"]').forEach(function (el) {
      if (el !== inp) el.value = String(v);
    });
  }

  function onToggle() {
    if (editing) {
      saveState(L.collectFullFromDom());
      setEditing(false);
    } else {
      setEditing(true);
    }
  }

  function onReset() {
    if (!window.confirm("Сбросить все трансформации картинок?")) return;
    saveState({});
    L.applyAll({});
    setSelected(null);
    if (editing) setEditing(false);
  }

  function onDocClick(e) {
    if (!editing) return;
    if (e.target.closest(".layout-editor-panel")) return;
    var root = L.getLayoutRoot(e.target);
    if (!root) setSelected(null);
  }

  function buildPanel() {
    var panel = document.createElement("div");
    panel.className = "layout-editor-panel";
    panelEl = panel;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Редактор трансформации изображений");
    panel.innerHTML =
      '<p class="layout-editor-panel__hint" hidden>' +
      "Сдвиг — перетаскивание. Колёсико — масштаб. Shift+колёсико — поворот. Alt+колёсико — наклон (skew). " +
      "Клик по картинке — выбор слоя; ползунки — точные значения." +
      "</p>" +
      '<div class="layout-editor-panel__transform" hidden>' +
      '<p class="layout-editor-panel__sub">Выбранный слой</p>' +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Сдвиг X (px)</span>' +
      '<input type="range" data-tkey="tx" min="-2500" max="2500" step="1" />' +
      '<input type="number" data-tkey="tx" step="1" class="layout-editor-num" />' +
      "</div>" +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Сдвиг Y (px)</span>' +
      '<input type="range" data-tkey="ty" min="-2500" max="2500" step="1" />' +
      '<input type="number" data-tkey="ty" step="1" class="layout-editor-num" />' +
      "</div>" +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Поворот (°)</span>' +
      '<input type="range" data-tkey="r" min="-180" max="180" step="0.5" />' +
      '<input type="number" data-tkey="r" step="0.5" class="layout-editor-num" />' +
      "</div>" +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Масштаб X</span>' +
      '<input type="range" data-tkey="sx" min="0.05" max="4" step="0.01" />' +
      '<input type="number" data-tkey="sx" step="0.01" class="layout-editor-num" />' +
      "</div>" +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Масштаб Y</span>' +
      '<input type="range" data-tkey="sy" min="0.05" max="4" step="0.01" />' +
      '<input type="number" data-tkey="sy" step="0.01" class="layout-editor-num" />' +
      "</div>" +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Наклон X (°)</span>' +
      '<input type="range" data-tkey="kx" min="-60" max="60" step="0.5" />' +
      '<input type="number" data-tkey="kx" step="0.5" class="layout-editor-num" />' +
      "</div>" +
      '<div class="layout-editor-field">' +
      '<span class="layout-editor-field__label">Наклон Y (°)</span>' +
      '<input type="range" data-tkey="ky" min="-60" max="60" step="0.5" />' +
      '<input type="number" data-tkey="ky" step="0.5" class="layout-editor-num" />' +
      "</div>" +
      "</div>" +
      '<div class="layout-editor-panel__actions">' +
      '<button type="button" class="layout-editor-panel__btn layout-editor-panel__btn--primary" data-layout-action="toggle" aria-pressed="false">Редактировать макет</button>' +
      '<button type="button" class="layout-editor-panel__btn" data-layout-action="reset">Сбросить всё</button>' +
      "</div>";

    document.body.appendChild(panel);

    panel.addEventListener("input", onPanelInput);

    panel.addEventListener("click", function (e) {
      var a = e.target.closest("[data-layout-action]");
      if (!a) return;
      if (a.getAttribute("data-layout-action") === "toggle") onToggle();
      if (a.getAttribute("data-layout-action") === "reset") onReset();
    });
  }

  function init() {
    L.applyAll(loadState());
    buildPanel();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    document.addEventListener("click", onDocClick, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
