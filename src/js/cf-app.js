/**
 * 121 Company Formation – redesign app JS
 * Upload minified build to eFiling Asset Manager as /assets/custom/files/app_min.js
 *
 * Buy-flow (mirrors live app_min.js):
 *   packagesBuyNow(slug)
 *     - if URL hash present (company name from name search) → /buy/{slug}/
 *     - else → /name-check/{slug}/
 *   nameSearch()
 *     - if hash → /buy/{hash}
 *     - else → /packages/#packages
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function hashValue() {
    return String(window.location.hash || "").replace(/^#/, "");
  }

  /** Live platform buy entry – keep as globals for onclick="packagesBuyNow(...)" */
  window.packagesBuyNow = function packagesBuyNow(slug) {
    if (!slug) return;
    var hash = hashValue();
    /* Hash is used by live name-check flow to carry the chosen company name into /buy/ */
    window.location.href = hash ? "/buy/" + slug + "/" : "/name-check/" + slug + "/";
  };

  window.nameSearch = function nameSearch() {
    var hash = hashValue();
    window.location.href = hash
      ? "/buy/" + hash
      : window.location.origin + "/packages/#packages";
  };

  /* -------------------- Mobile nav + dropdowns -------------------- */
  function closeAllDropdowns() {
    qsa(".cf-nav > li.is-open").forEach(function (li) {
      li.classList.remove("is-open");
      var btn = qs("[data-cf-dropdown]", li);
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function setNavOpen(open) {
    var wrap = qs("[data-cf-nav]");
    var backdrop = qs("[data-cf-nav-backdrop]");
    var burger = qs("[data-cf-burger]");
    if (!wrap) return;
    if (open) {
      if (!wrap._cfHome) {
        wrap._cfHome = { parent: wrap.parentNode, next: wrap.nextSibling };
      }
      if (wrap.parentNode !== document.body) {
        document.body.appendChild(wrap);
      }
      wrap.classList.add("is-open");
      if (backdrop) {
        backdrop.hidden = false;
        backdrop.classList.add("is-open");
      }
      if (burger) burger.setAttribute("aria-expanded", "true");
      document.documentElement.style.overflow = "hidden";
    } else {
      wrap.classList.remove("is-open");
      if (backdrop) {
        backdrop.classList.remove("is-open");
        backdrop.hidden = true;
      }
      if (burger) burger.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
      if (wrap._cfHome && wrap._cfHome.parent) {
        wrap._cfHome.parent.insertBefore(wrap, wrap._cfHome.next);
      }
      closeAllDropdowns();
    }
  }

  document.addEventListener("click", function (e) {
    var burger = e.target.closest("[data-cf-burger]");
    if (burger) {
      var wrap = qs("[data-cf-nav]");
      setNavOpen(!(wrap && wrap.classList.contains("is-open")));
      return;
    }
    if (e.target.closest("[data-cf-nav-backdrop]")) {
      setNavOpen(false);
      return;
    }
    var wrap = e.target.closest("[data-cf-nav]");
    if (wrap && !e.target.closest(".cf-nav")) {
      setNavOpen(false);
      return;
    }
    var ddBtn = e.target.closest("[data-cf-dropdown]");
    if (ddBtn) {
      var li = ddBtn.parentElement;
      var open = !li.classList.contains("is-open");
      closeAllDropdowns();
      if (open) {
        li.classList.add("is-open");
        ddBtn.setAttribute("aria-expanded", "true");
      }
      e.preventDefault();
      return;
    }
    if (!e.target.closest(".cf-nav > li")) closeAllDropdowns();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setNavOpen(false);
      closeAllDropdowns();
    }
  });

  /* -------------------- Package structure tabs -------------------- */
  function activatePackageTab(key, root) {
    if (!key) return;
    root = root || document;
    var matched = false;
    qsa("[data-cf-pkg-tab]", root).forEach(function (btn) {
      var on = btn.getAttribute("data-cf-pkg-tab") === key;
      if (on) matched = true;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (!matched) return;
    qsa("[data-cf-pkg-panel]", root).forEach(function (panel) {
      var on = panel.getAttribute("data-cf-pkg-panel") === key;
      panel.classList.toggle("is-active", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "hidden");
    });
  }

  document.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-cf-pkg-tab]");
    if (!tab) return;
    var key = tab.getAttribute("data-cf-pkg-tab");
    if (!key) return;
    var root = tab.closest(".cf-packages") || document;
    activatePackageTab(key, root);
  });

  /**
   * Live uses #packages → LBS tab, or #package-{key} (e.g. #package-llp).
   * Also accept short hashes (#llp / #lbg / #intl) and data-cf-pkg-goto.
   */
  function packageTabFromHash() {
    var raw = hashValue().toLowerCase();
    if (!raw || raw === "packages") return "lbs";
    if (raw.indexOf("package-") === 0) raw = raw.slice("package-".length);
    if (raw === "limited-by-shares" || raw === "lbs") return "lbs";
    if (raw === "limited-liability-partnership" || raw === "llp") return "llp";
    if (raw === "limited-by-guarantee" || raw === "lbg") return "lbg";
    if (raw === "international" || raw === "intl") return "intl";
    return null;
  }

  function initPackageTabsFromLocation() {
    if (window.location.pathname.indexOf("/packages") === -1) return;
    var key = packageTabFromHash();
    if (!key) return;
    qsa(".cf-packages").forEach(function (root) {
      activatePackageTab(key, root);
    });
    var target = qs("#packages") || qs(".cf-packages-compare") || qs(".cf-packages");
    if (target && hashValue()) {
      try {
        target.scrollIntoView({ block: "start" });
      } catch (_) {
        /* ignore */
      }
    }
  }

  /* -------------------- YouTube click-to-play -------------------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cf-yt]");
    if (!btn || btn.classList.contains("is-playing")) return;
    var id = btn.getAttribute("data-cf-yt");
    if (!id) return;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
    iframe.title = btn.getAttribute("aria-label") || "YouTube video";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.setAttribute("allowfullscreen", "allowfullscreen");
    btn.classList.add("is-playing");
    btn.appendChild(iframe);
  });

  /* -------------------- Buy CTA progressive enhancement -------------------- */
  document.addEventListener("click", function (e) {
    var buy = e.target.closest("[data-cf-buy]");
    if (!buy) return;
    var slug = buy.getAttribute("data-cf-buy");
    if (!slug) return;
    e.preventDefault();
    window.packagesBuyNow(slug);
  });

  if (document.body) document.body.classList.add("cf-redesign");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPackageTabsFromLocation);
  } else {
    initPackageTabsFromLocation();
  }
  window.addEventListener("hashchange", initPackageTabsFromLocation);
})();
