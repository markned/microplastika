/**
 * Shared layout transforms for layout-apply.js and layout-editor.js.
 * Exposes window.MicroplastikaLayout (no bundler).
 */
(function () {
  "use strict";

  var IMG_SEL = "main img[src*='assets/img']";
  var KEYS = ["tx", "ty", "r", "sx", "sy", "kx", "ky"];

  function defaults() {
    return { tx: 0, ty: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 };
  }

  function normalizeT(raw) {
    if (!raw || typeof raw !== "object") return defaults();
    var d = defaults();
    KEYS.forEach(function (k) {
      if (typeof raw[k] === "number" && !isNaN(raw[k])) d[k] = raw[k];
    });
    if (raw.s != null && typeof raw.s === "number") {
      d.sx = d.sy = raw.s;
    }
    return d;
  }

  function buildCSS(t) {
    t = normalizeT(t);
    return (
      "translate(" +
      t.tx +
      "px, " +
      t.ty +
      "px) rotate(" +
      t.r +
      "deg) skewX(" +
      t.kx +
      "deg) skewY(" +
      t.ky +
      "deg) scale(" +
      t.sx +
      ", " +
      t.sy +
      ")"
    );
  }

  function readFromWrap(wrap) {
    try {
      if (wrap.dataset.layoutTransform) {
        return normalizeT(JSON.parse(wrap.dataset.layoutTransform));
      }
    } catch (_) {}
    return defaults();
  }

  function applyToWrap(wrap, t) {
    t = normalizeT(t);
    wrap.style.transform = buildCSS(t);
    wrap.dataset.layoutTransform = JSON.stringify(t);
  }

  function layoutIdFromImg(img) {
    if (img.dataset.layoutId) return img.dataset.layoutId;
    var imgs = Array.from(document.querySelectorAll(IMG_SEL));
    var idx = imgs.indexOf(img);
    var src = img.getAttribute("src") || "";
    var base = src.split("/").pop() || "img";
    var id = idx + "-" + base;
    img.dataset.layoutId = id;
    return id;
  }

  function getLayoutRoot(el) {
    if (el.classList && el.classList.contains("layout-asset")) return el;
    if (el.parentElement && el.parentElement.classList.contains("layout-asset")) {
      return el.parentElement;
    }
    return null;
  }

  function ensureWrap(img) {
    var p = img.parentElement;
    if (p && p.classList && p.classList.contains("layout-asset")) {
      return p;
    }

    img.style.transform = "";

    var wrap = document.createElement("span");
    wrap.className = "layout-asset";

    var fullBleed =
      img.classList.contains("pdf-page__photo") &&
      !img.classList.contains("pdf-page__photo--half");

    if (fullBleed) {
      wrap.classList.add("layout-asset--fill");
    } else if (img.closest(".pdf-page__split") || img.closest(".pdf-page__triple")) {
      wrap.classList.add("layout-asset--gridcell");
    } else if (img.closest(".pdf-page__jealousy-arts")) {
      wrap.classList.add("layout-asset--jealousy");
    } else {
      wrap.classList.add("layout-asset--flow");
    }

    p.insertBefore(wrap, img);
    wrap.appendChild(img);

    return wrap;
  }

  function eachAsset(cb) {
    document.querySelectorAll(IMG_SEL).forEach(function (img) {
      var wrap = ensureWrap(img);
      var id = layoutIdFromImg(img);
      cb(wrap, id, img);
    });
  }

  function migrateEntry(stored) {
    if (!stored || typeof stored !== "object") return defaults();
    if ("sx" in stored || "r" in stored || "kx" in stored) return normalizeT(stored);
    if (typeof stored.tx === "number" || typeof stored.ty === "number") {
      return normalizeT({ tx: stored.tx, ty: stored.ty });
    }
    return defaults();
  }

  function applyAll(state) {
    eachAsset(function (wrap, id) {
      applyToWrap(wrap, migrateEntry(state[id]));
    });
  }

  function collectFullFromDom() {
    var out = {};
    eachAsset(function (wrap, id) {
      out[id] = readFromWrap(wrap);
    });
    return out;
  }

  window.MicroplastikaLayout = {
    IMG_SEL: IMG_SEL,
    KEYS: KEYS,
    defaults: defaults,
    normalizeT: normalizeT,
    buildCSS: buildCSS,
    readFromWrap: readFromWrap,
    applyToWrap: applyToWrap,
    layoutIdFromImg: layoutIdFromImg,
    getLayoutRoot: getLayoutRoot,
    ensureWrap: ensureWrap,
    eachAsset: eachAsset,
    migrateEntry: migrateEntry,
    applyAll: applyAll,
    collectFullFromDom: collectFullFromDom,
  };
})();
