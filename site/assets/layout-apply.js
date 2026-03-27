(function () {
  "use strict";

  function init() {
    var L = window.MicroplastikaLayout;
    if (!L) {
      console.error("layout-core.js must load before layout-apply.js");
      return;
    }
    var state = window.__MICROPLASTIKA_LAYOUT__;
    if (!state || typeof state !== "object") state = {};
    L.applyAll(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
