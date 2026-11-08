/**
 * Package tab deep-links (001 main.js) + redesign hash keys (#package-llp etc.).
 */
"use strict";

(function () {
  var url = window.location.href;
  var packageprefix = "#package";

  if (url.indexOf("packages") === -1) return;

  if (url.indexOf("#packages") !== -1) {
    if (typeof showTab === "function") showTab("#lbs-tab");
    return;
  }

  var hash = window.location.hash.substring(1);
  if (!hash) return;

  /* Legacy Bootstrap tabs (if present in CMS markup) */
  if (typeof showTab === "function") {
    showTab("#" + hash, packageprefix);
  }

  /* Redesign cf- pkg tabs */
  var key = hash.toLowerCase();
  if (key.indexOf("package-") === 0) key = key.slice("package-".length);
  if (key === "international") key = "intl";
  var map = { lbs: "lbs", llp: "llp", lbg: "lbg", intl: "intl" };
  key = map[key] || null;
  if (!key || !document.querySelector("[data-cf-pkg-tab]")) return;

  document.querySelectorAll(".cf-packages").forEach(function (root) {
    root.querySelectorAll("[data-cf-pkg-tab]").forEach(function (btn) {
      var on = btn.getAttribute("data-cf-pkg-tab") === key;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    root.querySelectorAll("[data-cf-pkg-panel]").forEach(function (panel) {
      var on = panel.getAttribute("data-cf-pkg-panel") === key;
      panel.classList.toggle("is-active", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "hidden");
    });
  });
})();
