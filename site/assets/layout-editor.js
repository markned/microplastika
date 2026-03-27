(function () {
  "use strict";

  const STORAGE_KEY = "microplastika-layout-v1";
  const SELECTOR = "main img[src*='assets/img']";

  function parseTransform(s) {
    if (!s || s === "none") return { tx: 0, ty: 0 };
    const m = s.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
    if (m) return { tx: parseFloat(m[1], 10), ty: parseFloat(m[2], 10) };
    return { tx: 0, ty: 0 };
  }

  function getTransform(el) {
    return parseTransform(el.style.transform);
  }

  function setTransform(el, tx, ty) {
    el.style.transform = "translate(" + tx + "px, " + ty + "px)";
  }

  function layoutId(img) {
    if (img.dataset.layoutId) return img.dataset.layoutId;
    const imgs = Array.from(document.querySelectorAll(SELECTOR));
    const idx = imgs.indexOf(img);
    const src = img.getAttribute("src") || "";
    const base = src.split("/").pop() || "img";
    const id = idx + "-" + base;
    img.dataset.layoutId = id;
    return id;
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveState(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  function applyAll(state) {
    document.querySelectorAll(SELECTOR).forEach(function (img) {
      var id = layoutId(img);
      var t = state[id];
      if (t && typeof t.tx === "number" && typeof t.ty === "number") {
        setTransform(img, t.tx, t.ty);
      } else {
        setTransform(img, 0, 0);
      }
    });
  }

  function collectFullFromDom() {
    var out = {};
    document.querySelectorAll(SELECTOR).forEach(function (img) {
      var id = layoutId(img);
      var tr = getTransform(img);
      out[id] = { tx: tr.tx, ty: tr.ty };
    });
    return out;
  }

  var editing = false;
  var active = null;
  var startPointer = { x: 0, y: 0 };
  var startTranslate = { tx: 0, ty: 0 };

  function setEditing(on) {
    editing = on;
    document.body.classList.toggle("layout-edit-mode", on);
    var primary = document.querySelector("[data-layout-action='toggle']");
    var hint = document.querySelector(".layout-editor-panel__hint");
    if (primary) {
      primary.textContent = on ? "Сохранить и зафиксировать" : "Редактировать позиции";
      primary.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (hint) {
      hint.hidden = !on;
    }
  }

  function onPointerDown(e) {
    if (!editing) return;
    var t = e.target;
    if (t.tagName !== "IMG" || !t.src || t.src.indexOf("assets/img") === -1) return;
    e.preventDefault();
    active = t;
    t.setPointerCapture(e.pointerId);
    startPointer = { x: e.clientX, y: e.clientY };
    startTranslate = getTransform(t);
    t.classList.add("layout-dragging");
  }

  function onPointerMove(e) {
    if (!editing || !active) return;
    var dx = e.clientX - startPointer.x;
    var dy = e.clientY - startPointer.y;
    setTransform(active, startTranslate.tx + dx, startTranslate.ty + dy);
  }

  function onPointerUp(e) {
    if (active) {
      try {
        active.releasePointerCapture(e.pointerId);
      } catch (_) {}
      active.classList.remove("layout-dragging");
      active = null;
    }
  }

  function onToggle() {
    if (editing) {
      saveState(collectFullFromDom());
      setEditing(false);
    } else {
      setEditing(true);
    }
  }

  function onReset() {
    if (!window.confirm("Сбросить все смещения картинок?")) return;
    saveState({});
    applyAll({});
    if (editing) setEditing(false);
  }

  function buildPanel() {
    var panel = document.createElement("div");
    panel.className = "layout-editor-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Редактор положения изображений");
    panel.innerHTML =
      '<p class="layout-editor-panel__hint" hidden>Режим правки: перетаскивайте картинки. Нажмите «Сохранить», чтобы зафиксировать.</p>' +
      '<div class="layout-editor-panel__actions">' +
      '<button type="button" class="layout-editor-panel__btn layout-editor-panel__btn--primary" data-layout-action="toggle" aria-pressed="false">Редактировать позиции</button>' +
      '<button type="button" class="layout-editor-panel__btn" data-layout-action="reset">Сбросить</button>' +
      "</div>";
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      var a = e.target.closest("[data-layout-action]");
      if (!a) return;
      if (a.getAttribute("data-layout-action") === "toggle") onToggle();
      if (a.getAttribute("data-layout-action") === "reset") onReset();
    });
  }

  function init() {
    applyAll(loadState());
    buildPanel();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
