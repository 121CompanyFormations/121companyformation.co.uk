/**
 * 121 redesign UI (nav / package tabs / youtube).
 * Buy-flow globals live in functions.js (packagesBuyNow, nameSearch) – same as 001.
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

  var SEARCH_STARTED_KEY = "cf-search-started";
  var PACKAGE_NAV_HASHES = {
    packages: 1,
    lbs: 1,
    llp: 1,
    lbg: 1,
    intl: 1,
    international: 1,
    "limited-by-shares": 1,
    "limited-liability-partnership": 1,
    "limited-by-guarantee": 1,
    "package-lbs": 1,
    "package-llp": 1,
    "package-lbg": 1,
    "package-intl": 1,
    "package-international": 1,
  };

  function markSearchStarted() {
    try {
      sessionStorage.setItem(SEARCH_STARTED_KEY, "1");
    } catch (_) {
      /* ignore */
    }
  }

  function isPackageNavHash(raw) {
    var key = String(raw || "").toLowerCase();
    if (!key) return false;
    if (PACKAGE_NAV_HASHES[key]) return true;
    if (key.indexOf("package-") === 0) return true;
    return false;
  }

  function hasSearchStarted() {
    try {
      if (sessionStorage.getItem(SEARCH_STARTED_KEY) === "1") return true;
    } catch (_) {
      /* ignore */
    }
    var nameEl = document.getElementById("company_name");
    if (nameEl && String(nameEl.value || "").trim()) return true;
    try {
      var params = new URLSearchParams(window.location.search || "");
      if (String(params.get("name") || "").trim()) return true;
    } catch (_) {
      /* ignore */
    }
    var h = hashValue();
    if (h && !isPackageNavHash(h)) return true;
    return false;
  }

  /* Package CTAs: first visit = Buy now; after name search = Start Now */
  function updatePackageCtaLabels() {
    var label = hasSearchStarted() ? "Start Now" : "Buy now";
    qsa(".cf-packages a[onclick*='packagesBuyNow']").forEach(function (a) {
      a.textContent = label;
    });
  }

  function initPackageCtaJourney() {
    if (hasSearchStarted()) markSearchStarted();

    qsa("form.cf-namecheck, form[action*='name-check']").forEach(function (form) {
      form.addEventListener("submit", function () {
        markSearchStarted();
        updatePackageCtaLabels();
      });
    });

    var nameEl = document.getElementById("company_name");
    if (nameEl) {
      nameEl.addEventListener("change", function () {
        if (String(nameEl.value || "").trim()) {
          markSearchStarted();
          updatePackageCtaLabels();
        }
      });
    }

    updatePackageCtaLabels();
  }

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
      if (burger) {
        burger.classList.add("is-open");
        burger.setAttribute("aria-expanded", "true");
        burger.setAttribute("aria-label", "Close menu");
      }
      document.documentElement.style.overflow = "hidden";
      var closeBtn = qs("[data-cf-nav-close]", wrap);
      if (closeBtn && closeBtn.focus) {
        try {
          closeBtn.focus({ preventScroll: true });
        } catch (_) {
          closeBtn.focus();
        }
      }
    } else {
      wrap.classList.remove("is-open");
      if (backdrop) {
        backdrop.classList.remove("is-open");
        backdrop.hidden = true;
      }
      if (burger) {
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Open menu");
      }
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
    if (e.target.closest("[data-cf-nav-close]")) {
      setNavOpen(false);
      return;
    }
    if (e.target.closest("[data-cf-nav-backdrop]")) {
      setNavOpen(false);
      return;
    }
    var wrap = e.target.closest("[data-cf-nav]");
    if (wrap && !e.target.closest(".cf-nav-panel")) {
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

  /* -------------------- /name-check/ static preview -------------------- */
  var NAMECHECK_PACKAGES = {
    "lbs-bronze": {
      title: "Bronze Package",
      type: "Limited by Shares",
      price: "£110.95",
      blurb: "Fast, economical company formation with electronic documents and free banking referral.",
      more: "/lbs-bronze/",
      features: [
        "Incorporated limited company ready to trade",
        "Officers appointed and ordinary shares issued",
        "PDF Certificate of Incorporation &amp; constitutional docs",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbs-gold": {
      title: "Gold Package",
      type: "Limited by Shares",
      price: "£192.99",
      blurb: "Everything in Bronze, plus free filing of your first year’s Confirmation Statement.",
      more: "/lbs-gold/",
      features: [
        "Everything in the Bronze Package",
        "Free first-year Confirmation Statement filing",
        "Electronic company documents",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbs-platinum": {
      title: "Platinum Package",
      type: "Limited by Shares",
      price: "£242.99",
      blurb: "Gold inclusions plus VAT registration with HMRC — ideal if you’ll need a VAT number.",
      more: "/lbs-platinum/",
      features: [
        "Everything in the Gold Package",
        "VAT registration with HMRC",
        "Free first-year Confirmation Statement filing",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbs-diamond": {
      title: "Diamond Package",
      type: "Limited by Shares",
      price: "£506.99",
      blurb: "All-inclusive first year: formation, VAT, Confirmation Statement and year-end accounts support.",
      more: "/lbs-diamond/",
      features: [
        "Everything in the Platinum Package",
        "First-year accounts &amp; Corporation Tax return*",
        "Optional quarterly VAT returns at a special rate",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "llp-bronze": {
      title: "LLP Bronze",
      type: "Limited Liability Partnership",
      price: "£135.95",
      blurb: "Straightforward LLP registration with electronic documents and portal access.",
      more: "/packages/#package-llp",
      features: [
        "LLP registration at Companies House",
        "Members appointed",
        "Electronic incorporation documents",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "llp-gold": {
      title: "LLP Gold",
      type: "Limited Liability Partnership",
      price: "£212.99",
      blurb: "LLP formation with extra first-year filing support.",
      more: "/packages/#package-llp",
      features: [
        "Everything in LLP Bronze",
        "Free first-year Confirmation Statement filing",
        "Electronic incorporation documents",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "llp-platinum": {
      title: "LLP Platinum",
      type: "Limited Liability Partnership",
      price: "£262.99",
      blurb: "Enhanced LLP package with VAT registration included.",
      more: "/packages/#package-llp",
      features: [
        "Everything in LLP Gold",
        "VAT registration with HMRC",
        "Free first-year Confirmation Statement filing",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "llp-diamond": {
      title: "LLP Diamond",
      type: "Limited Liability Partnership",
      price: "£526.99",
      blurb: "Premium LLP setup covering first-year statutory filings and accountancy support.",
      more: "/packages/#package-llp",
      features: [
        "Everything in LLP Platinum",
        "First-year accounts support*",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbg-bronze": {
      title: "LBG Bronze",
      type: "Limited by Guarantee",
      price: "£135.95",
      blurb: "Company limited by guarantee formation for non-profit and membership structures.",
      more: "/packages/#package-lbg",
      features: [
        "LBG registration at Companies House",
        "Officers / members set up",
        "Electronic incorporation documents",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbg-gold": {
      title: "LBG Gold",
      type: "Limited by Guarantee",
      price: "£212.99",
      blurb: "LBG formation plus free filing of the first year’s Confirmation Statement.",
      more: "/packages/#package-lbg",
      features: [
        "Everything in LBG Bronze",
        "Free first-year Confirmation Statement filing",
        "Electronic incorporation documents",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbg-platinum": {
      title: "LBG Platinum",
      type: "Limited by Guarantee",
      price: "£262.99",
      blurb: "LBG package with VAT registration included.",
      more: "/packages/#package-lbg",
      features: [
        "Everything in LBG Gold",
        "VAT registration with HMRC",
        "Free first-year Confirmation Statement filing",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "lbg-diamond": {
      title: "LBG Diamond",
      type: "Limited by Guarantee",
      price: "£526.99",
      blurb: "Premium LBG package with first-year statutory and accountancy support.",
      more: "/packages/#package-lbg",
      features: [
        "Everything in LBG Platinum",
        "First-year accounts support*",
        "Free admin portal access",
        "Free business banking referral",
      ],
    },
    "international-package": {
      title: "International Package",
      type: "International formation",
      price: "£286.99",
      blurb: "UK company formation support tailored for international founders.",
      more: "/packages/#package-intl",
      features: [
        "UK company registration support",
        "Electronic incorporation documents",
        "Guidance for overseas directors / shareholders",
        "Free admin portal access",
      ],
    },
    "international-plus-package": {
      title: "International Plus",
      type: "International formation",
      price: "£501.99",
      blurb: "Enhanced international package with broader first-year support.",
      more: "/packages/#package-intl",
      features: [
        "Everything in International Package",
        "Extra first-year compliance support",
        "Electronic incorporation documents",
        "Free admin portal access",
      ],
    },
  };

  function packageSlugFromPath() {
    var parts = String(window.location.pathname || "")
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean);
    // /name-check/{package}/
    if (parts[0] === "name-check" && parts[1]) return parts[1];
    return "";
  }

  function fillNameCheckPackage(pkgWrap, slug) {
    var info = NAMECHECK_PACKAGES[slug] || {
      title: slug
        .split("-")
        .map(function (w) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" "),
      type: "Formation package",
      price: "",
      blurb: "Continue your order with the package you selected.",
      more: "/packages/#packages",
      features: ["Company registration support", "Electronic documents", "Free admin portal access"],
    };

    var title = qs("[data-cf-namecheck-package-title]", pkgWrap);
    var type = qs("[data-cf-namecheck-package-type]", pkgWrap);
    var price = qs("[data-cf-namecheck-package-price]", pkgWrap);
    var blurb = qs("[data-cf-namecheck-package-blurb]", pkgWrap);
    var features = qs("[data-cf-namecheck-package-features]", pkgWrap);
    var buy = qs("[data-cf-namecheck-buy]", pkgWrap);
    var more = qs("[data-cf-namecheck-more]", pkgWrap);

    if (title) title.textContent = info.title;
    if (type) type.textContent = info.type;
    if (price) price.textContent = info.price || "See packages";
    if (blurb) blurb.textContent = info.blurb;
    if (features) {
      features.innerHTML = (info.features || [])
        .map(function (item) {
          return "<li>" + item + "</li>";
        })
        .join("");
    }
    if (buy) buy.setAttribute("href", "/buy/" + slug + "/");
    if (more) more.setAttribute("href", info.more || "/packages/#packages");
  }

  function initNameCheckPreview() {
    var root = qs("[data-cf-namecheck]");
    if (!root) return;
    if (document.body) document.body.classList.add("name-check");

    var params = new URLSearchParams(window.location.search);
    var name = String(params.get("name") || "")
      .replace(/\+/g, " ")
      .trim();
    var input = qs("#company_name") || qs("[name='name']");
    if (input && name) input.value = name;

    var result = qs("#efNameCheckResult", root);
    var nameEl = qs("[data-cf-namecheck-name]", root);

    if (name) {
      markSearchStarted();
      if (nameEl) nameEl.textContent = name.toUpperCase();
      if (result) result.hidden = false;
      qsa(".name-check-default", root).forEach(function (el) {
        el.classList.add("is-hidden");
      });
      root.classList.add("has-result");
      document.title = name.toUpperCase() + " | Company Name Check | 121 Company Formation";
    } else {
      if (result) result.hidden = true;
      qsa(".name-check-default", root).forEach(function (el) {
        el.classList.remove("is-hidden");
      });
      root.classList.remove("has-result");
    }

    var pkg = packageSlugFromPath();
    var pkgWrap = qs("[data-cf-namecheck-package]", root);
    if (pkg && pkgWrap) {
      pkgWrap.hidden = false;
      fillNameCheckPackage(pkgWrap, pkg);
    }
  }

  /* -------------------- Formation checklist progress -------------------- */
  function initChecklists() {
    qsa("[data-cf-checklist]").forEach(function (root) {
      var key = "cf-checklist:" + (location.pathname || "/");
      var items = qsa("[data-cf-checklist-item]", root);
      var doneEl = qs("[data-cf-checklist-done]", root);
      var totalEl = qs("[data-cf-checklist-total]", root);
      var bar = qs("[data-cf-checklist-bar]", root);
      var fill = qs("[data-cf-checklist-fill]", root);
      var total = items.length;
      if (totalEl) totalEl.textContent = String(total);

      var saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(key) || "{}") || {};
      } catch (_) {
        saved = {};
      }

      function render() {
        var done = 0;
        items.forEach(function (input) {
          var id = input.getAttribute("data-cf-checklist-item");
          if (input.checked) done += 1;
          var wrap = input.closest(".cf-checklist__tab-wrap");
          if (wrap) wrap.classList.toggle("is-done", !!input.checked);
          if (id) saved[id] = !!input.checked;
        });
        if (doneEl) doneEl.textContent = String(done);
        if (bar) {
          bar.setAttribute("aria-valuenow", String(done));
          bar.setAttribute("aria-valuemax", String(total));
        }
        if (fill) fill.style.width = total ? Math.round((done / total) * 100) + "%" : "0%";
        try {
          localStorage.setItem(key, JSON.stringify(saved));
        } catch (_) {
          /* ignore */
        }
      }

      items.forEach(function (input) {
        var id = input.getAttribute("data-cf-checklist-item");
        if (id && saved[id]) input.checked = true;
        input.addEventListener("change", render);
      });
      render();
    });
  }

  if (document.body) document.body.classList.add("cf-redesign");

  function boot() {
    initPackageTabsFromLocation();
    initNameCheckPreview();
    initChecklists();
    initPackageCtaJourney();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("hashchange", function () {
    initPackageTabsFromLocation();
    updatePackageCtaLabels();
  });
})();
