/**
 * eFiling platform helpers (same behaviour as 001formationagent functions.js).
 * packagesBuyNow / nameSearch drive the client buy flow into /name-check/ or /buy/.
 */
"use strict";

function eventFire(el, etype) {
  if (!el) return;
  if (el.fireEvent) {
    el.fireEvent("on" + etype);
  } else {
    var evObj = document.createEvent("Events");
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function openChat() {
  var link = document.getElementById("lc_chat_header");
  if (link) link.click();
}

function showTab(defaultab, prefix) {
  var url = window.location.href;
  if (prefix) {
    var queryStringValue = url.split(prefix)[1];
    if (queryStringValue) {
      queryStringValue = queryStringValue.replace("-", "") + "-tab";
      if (url.indexOf(prefix) !== -1) {
        eventFire(document.getElementById(queryStringValue), "click");
      }
    }
  } else if (window.jQuery) {
    window.jQuery(defaultab).trigger("click");
  } else {
    var el = typeof defaultab === "string" ? document.querySelector(defaultab) : defaultab;
    eventFire(el, "click");
  }
}

function nameSearch() {
  var upsell = window.location.hash.substring(1);
  if (upsell) {
    window.location.href = "/buy/" + upsell;
  } else {
    window.location.href = window.location.origin + "/packages/#packages";
  }
}

function packagesBuyNow(packageSlug) {
  var upsell = window.location.hash.substring(1);
  if (upsell) {
    window.location.href = "/buy/" + packageSlug + "/";
  } else {
    window.location.href = "/name-check/" + packageSlug + "/";
  }
}

/* Expose for onclick= handlers in CMS HTML */
window.eventFire = eventFire;
window.openChat = openChat;
window.showTab = showTab;
window.nameSearch = nameSearch;
window.packagesBuyNow = packagesBuyNow;
