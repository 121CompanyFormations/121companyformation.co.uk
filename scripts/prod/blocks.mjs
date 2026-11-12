/**
 * Block assembly for prod-effiling/blocks.
 *
 * Single source of truth: prod-effiling/blocks (edit redesign blocks there).
 * build:prod snapshots that folder, regenerates tracking/restyled/verbatim blocks,
 * and writes redesign blocks back from the snapshot.
 *
 * Rules
 *  - Every block of the live export keeps its name (same placeholder in Layout / pages).
 *  - Visible redesign blocks live in prod-effiling/blocks and are re-emitted from the snapshot.
 *  - Tracking / chat / price / data blocks are copied untouched from the live backup.
 *  - Blocks superseded by the redesign are not shipped (listed in REMOVED with the reason).
 */
import path from "node:path";
import { ROOT, BACKUP, OUT, read, mapAssets, restorePriceTokens, useWhatsappBlock, stripBlockComment } from "./lib.mjs";

/** Default: editable redesign blocks in prod-effiling/blocks. build:prod may override via setProjectBlocksPath (snapshot). */
let PROJECT_BLOCKS = path.join(OUT, "blocks");
const BACKUP_BLOCKS = path.join(BACKUP, "blocks");

/** Preview-only helpers that must survive build:prod (used by sync-from-live / static site). */
export const EXTRA_PREVIEW = [
  "BLOG_CARD",
  "BLOG_LIST",
  "BLOG_POST_LAYOUT",
  "BREADCRUMBS",
  "CTA_BAND",
  "LEGAL_LAYOUT",
  "PAGE_HERO_INNER",
  "TRUST_BAR",
];

export function setProjectBlocksPath(p) {
  PROJECT_BLOCKS = p;
}

export function getProjectBlocksPath() {
  return PROJECT_BLOCKS;
}

export const projectBlock = (name) =>
  mapAssets(useWhatsappBlock(restorePriceTokens(stripBlockComment(read(path.join(PROJECT_BLOCKS, `${name}.html`))))))
    .replace(/\s+$/, "") + "\n";

export const backupBlock = (name) => read(path.join(BACKUP_BLOCKS, `${name}.html`));

/** Redesign blocks edited in prod-effiling/blocks. */
export const FROM_PROJECT = [
  "HEADER",
  "HEADER_TOP",
  "HEADER_NAV",
  "HERO_Homepage",
  "Services",
  "HOME_PACKAGES_DESKTOP",
  "HOME_PACKAGES_MOBILE",
  "HOME_PACKAGES_COMPARE",
  "HELP_SECTION",
  "YOUTUBE_SECTION",
  "HOW_IT_WORKS",
  "BANKING_PARTNERS",
  "POPULAR_SERVICES",
  "WHY_US",
  "FAQ_HOME",
  "FOOTER_Register",
  "SERVICE_SIDEBAR",
  "SIDEBAR_CONTACT",
  "SIDEBAR_PACKAGES",
  "BLOG_SIDEBAR",
  "PACKAGE_PAGE_LBS_Desktop",
  "PACKAGE_PAGE_LBS_Mobile",
  "PACKAGE_PAGE_LLP_Desktop",
  "PACKAGE_PAGE_LLP_Mobile",
  "PACKAGE_PAGE_LBG_Desktop",
  "PACKAGE_PAGE_LBG_Mobile",
  "PACKAGE_PAGE_INTERNATIONAL_Desktop",
  "PACKAGE_PAGE_INTERNATIONAL_Mobile",
];

/** Copied from the live export without changes. */
export const VERBATIM = [
  "BING_GLOBAL_TAG",
  "CONTENT_PAGE_KEYWORDS",
  "COPY_YEAR",
  "FB_PIXEL",
  "FRESHCHAT",
  "GA1",
  "GOOGLE_ANALYTICS",
  "Google_TM_Global",
  "INITIAL_CHECKOUT_JS",
  "LIVECHAT",
  "SITE_MESSAGE_",
  "WHATSAPP_NUMBER",
  "REGISTERED_OFFICE_ADDRESS_PRICE",
  "TRADE_MAIL_FORWARDING_Price",
  ...["LBS", "LBG", "LLP"].flatMap((g) => ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"].map((t) => `${g}-PACKAGE_${t}_Price`)),
  "INTERNATIONAL-PACKAGE_Price",
  "INTERNATIONAL-PACKAGE_PLUS_Price",
];

/** Live blocks that are not shipped, with the reason (printed in prod-effiling/README.md). */
export const REMOVED = {
  ACS_CSS: "old theme helper classes (.heading-1, .content-1, .hov …) – markup no longer exists",
  CSS_TEASERS: "old hero/register teasers; the still-relevant rules moved to dev/static/scss/efilling/_legacy-prod.scss",
  Banking: "replaced by BANKING_PARTNERS",
  FAQ: "replaced by FAQ_HOME",
  HOME_Services: "replaced by POPULAR_SERVICES",
  HOME_PACKAGES: "old home packages wrapper (HOME_PACKAGES_DESKTOP / _MOBILE / HOME_PACKAGES_COMPARE replace it)",
  HOME_LBS_PACKAGE_li: "old home package list item",
  PACKAGE_BRONZE_: "old package card (replaced by the package tables)",
  PACKAGE_SILVER_: "old package card (replaced by the package tables)",
  PACKAGE_GOLD_: "old package card (replaced by the package tables)",
  PACKAGE_PLATINUM_: "old package card (replaced by the package tables)",
  PACKAGE_DIAMOND_: "old package card (replaced by the package tables)",
  PACKAGE_PAGE_LBS: "old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE)",
  PACKAGE_PAGE_LLP: "old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE)",
  PACKAGE_PAGE_LBG: "old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE)",
  PACKAGE_PAGE_INTERNATIONAL: "old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE)",
  PACKAGE_PAGE_LBS_Li: "old list items (the redesigned *_Mobile blocks are self-contained)",
  PACKAGE_PAGE_LLP_Li: "old list items (the redesigned *_Mobile blocks are self-contained)",
  PACKAGE_PAGE_LBG_Li: "old list items (the redesigned *_Mobile blocks are self-contained)",
  PACKAGE_PAGE_INTERNATIONAL_Li: "old list items (the redesigned *_Mobile blocks are self-contained)",
  PACKAGE_PAGE_INTERNATIONAL_PLUS_Li: "old list items (the redesigned *_Mobile blocks are self-contained)",
  HEADER_NAV_LOGO: "logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated",
  HEADER_NAV_BUTTON: "logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated",
  HEADER_NAV_MENU: "logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated",
  HEADER_NAV_MENU_ul: "logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated",
  HEADER_NAV_MENU_Login: "Sign in button is part of HEADER_NAV",
  HEADER_NAV_MENU_Account: "account menu is part of HEADER_NAV_Authenticated",
};

/* ------------------------------------------------------------------ generated */

export function headerAuthenticated() {
  return `##HEADER_TOP#
<header class="cf-header">
  ##HEADER_NAV_Authenticated#
</header>
`;
}

/** Logged-in navigation: HEADER_NAV + "My account" menu (links of the old HEADER_NAV_MENU_Account). */
export function headerNavAuthenticated() {
  let nav = projectBlock("HEADER_NAV");
  const account = `      <li role="none">
        <button type="button" class="cf-nav__toggle-btn" aria-expanded="false" data-cf-dropdown role="menuitem">
          Account <span class="cf-nav__caret" aria-hidden="true"></span>
        </button>
        <div class="cf-dropdown cf-dropdown--right" role="menu">
          <a href="/account/" role="menuitem">My Account</a>
          <a href="/order-history/" role="menuitem">Orders</a>
          <a href="/companies/" role="menuitem">Companies</a>
          <a href="/services/" role="menuitem">Services</a>
          <a href="/payments/" role="menuitem">Finances</a>
          <a class="cf-dropdown__cta" href="/?gle=logout" role="menuitem">Logout</a>
        </div>
      </li>
`;
  // append to the main <ul class="cf-nav">
  nav = nav.replace(/(\n    <\/ul>)/, `\n${account.replace(/\n$/, "")}$1`);
  // Sign in → Logout
  nav = nav.replace(/<a class="cf-btn cf-btn--ghost cf-btn--block" href="\/login\/">Sign in<\/a>/, '<a class="cf-btn cf-btn--ghost cf-btn--block" href="/?gle=logout">Logout</a>');
  nav = nav.replace(/<a class="cf-btn cf-btn--ghost cf-btn--sm" href="\/login\/">Sign in<\/a>/, '<a class="cf-btn cf-btn--ghost cf-btn--sm" href="/?gle=logout">Logout</a>');
  return nav;
}

export function footer() {
  let f = projectBlock("FOOTER");
  // The previous footer linked the refund policy; keep it reachable (idempotent).
  if (!/refund-and-cancellation-policy/.test(f)) {
    f = f.replace(
      '<a href="/privacy-policy/">Privacy Policy</a>',
      '<a href="/privacy-policy/">Privacy Policy</a>\n        <a href="/refund-and-cancellation-policy/">Refund Policy</a>'
    );
  }
  return f;
}

export function cssBlock(version) {
  return `<!-- Redesign stylesheet (marketing + eFiling theme). Upload assets/custom/files/app_min.css; bump ?v= on every upload. -->
<link rel="stylesheet" href="/assets/custom/files/app_min.css?v=${version}" />
`;
}

export function javascriptBlock(version) {
  return `<script id="app_min" defer src="/assets/custom/files/app_min.js?v=${version}"></script>
`;
}

export function htmlHead() {
  return `<meta charset="utf-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<title>##PAGE_TITLE#</title>

<meta name="DESCRIPTION" content="##PAGE_DESCRIPTION#" />
<meta name="KEYWORDS" content="##PAGE_KEYWORDS#" />
<meta name="OWNER" content="121 Company Formation" />
<meta
  name="COPYRIGHT"
  content="&copy; Copyright 2011-##COPY_YEAR#, 121companyformation.co.uk"
/>
<meta name="AUTHOR" content="121 Company Formation" />
<meta
  name="facebook-domain-verification"
  content="rodzvwri85z4qfks0jp3furw84atwl"
/>
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#0B1530" />

<link rel="icon" href="/assets/custom/images/favicon.ico?v=10" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
##CSS#
`;
}

export function preloader() {
  return `<div id="preloaderbody" class="preloader-body" aria-hidden="true">
  <div class="preloader">
    <span class="whirly-loader"
      ><img
        src="/assets/custom/images/logo-wordmark-dark.svg"
        alt=""
        width="266"
        height="58"
    /></span>
  </div>
</div>

<style>
  .preloader {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .preloader-body {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 99999999;
    background: #ffffff;
    top: 0;
  }

  .whirly-loader img {
    display: block;
    max-width: min(266px, 70vw);
    height: auto;
    animation: cf-preloader-pulse 1.2s ease-in-out infinite;
  }

  @keyframes cf-preloader-pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }
</style>
<script>
  window.addEventListener("load", function () {
    document.querySelector("#preloaderbody").style.display = "none";
  });
</script>
`;
}

/** Cookie notice: same behaviour, brand colours / typography. */
export function cookies() {
  const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  let t = backupBlock("COOKIES");
  t = t
    .replace(/"Open Sans", HelveticaNeue, "Helvetica Neue\/?", Helvetica, Arial, sans-serif/g, FONT)
    .replace("background: #ff8303 !important;", "background: #0b1530 !important;")
    .replace("margin: 20px;\n  border-radius: 4px;", "margin: 20px;\n  border-radius: 14px;")
    .replace(
      "background: #fff !important;\n  border: none !important;\n  color: #fd5602 !important;\n  border: 1px solid #fd5602;\n  border-radius: 4px;",
      "background: linear-gradient(135deg, #ff9a1f 0%, #e8461e 100%) !important;\n  border: none !important;\n  color: #fff !important;\n  border-radius: 999px;"
    )
    .replace("color: #212121 !important;\n}", "color: #ff9a1f !important;\n}");
  return t;
}

export function initialCheckoutCss() {
  return `<!-- INITIAL_CHECKOUT_CSS
     The optional-products tooltip rules that lived here moved into the redesign stylesheet
     (dev/static/scss/efilling/_legacy-prod.scss → assets/custom/files/app_min.css).
     The block is kept (empty) because the checkout template still includes it. -->
`;
}

/* ------------------------------------------------------- restyled legacy blocks */

const NAMECHECK_FORM = (extraClass = "") => `<form class="cf-namecheck${extraClass}" action="/name-check###CUSTOM3#" method="GET" novalidate role="search">
  <input name="gle" type="hidden" value="namecheck" />
  <label class="cf-sr-only" for="company_name">Type a company name</label>
  <input
    id="company_name"
    class="efInputText"
    name="name"
    type="text"
    value="##COMPANY_REQUESTED_NAME#"
    placeholder="Type a name"
    autocomplete="organization"
    aria-label="Type a name"
  />
  <button class="cf-btn cf-btn--primary efSubmitButton" type="submit">Search</button>
</form>
`;

export const nameCheckForm = () => NAMECHECK_FORM(" cf-namecheck--wide");

const CRUMB = (current) => `    <nav class="cf-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      <span class="cf-breadcrumbs__current">${current}</span>
    </nav>`;

/** CUSTOM5 = ##HERO_PAGE# → title ##CUSTOM1#, lead = meta description. */
export const heroPage = () => `<section class="cf-page-hero" aria-label="Page header">
  <div class="cf-container cf-page-hero__inner">
${CRUMB("##CUSTOM1#")}
    <h1 class="cf-page-hero__title">##CUSTOM1#</h1>
    <p class="cf-page-hero__lead">##PAGE_DESCRIPTION#</p>
  </div>
</section>
`;

/** CUSTOM5 = ##HERO_PAGE_Services2# → title only. */
export const heroPageServices2 = () => `<section class="cf-page-hero" aria-label="Page header">
  <div class="cf-container cf-page-hero__inner">
${CRUMB("##CUSTOM1#")}
    <h1 class="cf-page-hero__title">##CUSTOM1#</h1>
  </div>
</section>
`;

/** CUSTOM5 = ##HERO_PAGE_Services# → package hero: ##CUSTOM2# is the price block, Buy now → /name-check##PAGE_URL#. */
export const heroPageServices = () => `<section class="cf-page-hero cf-page-hero--package" aria-label="Page header">
  <div class="cf-container">
${CRUMB("##CUSTOM1#")}
    <div class="cf-page-hero__row">
      <div class="cf-page-hero__copy">
        <h1 class="cf-page-hero__title">##CUSTOM1#</h1>
        <p class="cf-page-hero__price">The one-off fee for the ##CUSTOM1# is just <strong>##CUSTOM2#</strong></p>
      </div>
      <a class="cf-btn cf-btn--light" href="/name-check##PAGE_URL#">Buy Now</a>
    </div>
  </div>
</section>
`;

/** CUSTOM5 = ##HERO_PAGE_Help# → name availability search hero. */
export const heroPageHelp = () => `<section class="cf-namesearch-hero" aria-labelledby="cf-namesearch-title">
  <div class="cf-container cf-namesearch-hero__inner">
${CRUMB("##PAGE_TITLE#")}
    <h1 id="cf-namesearch-title" class="cf-namesearch-hero__title">Check if your company name is available</h1>
    <form class="cf-namecheck cf-namecheck--wide" action="/name-check/" method="GET" novalidate role="search">
      <input name="gle" type="hidden" value="namecheck" />
      <label class="cf-sr-only" for="company_name">Type a company name</label>
      <input
        id="company_name"
        class="efInputText"
        name="name"
        type="text"
        value="##COMPANY_REQUESTED_NAME#"
        placeholder="Type a name"
        autocomplete="organization"
        aria-label="Type a name"
      />
      <button class="cf-btn cf-btn--primary efSubmitButton" type="submit">Check now</button>
    </form>
  </div>
</section>
`;

export const buyUnavailable = () => `<section class="cf-section" aria-labelledby="cf-buy-unavailable-title">
  <div class="cf-container">
    <div class="cf-card" style="max-width: 640px; margin: 0 auto; text-align: center; padding: 48px 32px">
      <div class="cf-card__icon" aria-hidden="true" style="margin: 0 auto 20px">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
      </div>
      <h1 id="cf-buy-unavailable-title" class="cf-h2">Service currently unavailable</h1>
      <p class="cf-lead" style="margin-left: auto; margin-right: auto">
        We’re currently unable to process purchases for
        <strong>##PACKAGE_NAME#</strong> at the moment. This may be due to
        temporary maintenance, configuration updates, or availability
        restrictions.
      </p>
      <p>
        If you need immediate assistance or would like help completing your
        request, our support team is available to assist you directly.
      </p>
      <div class="cf-cta__actions">
        <a class="cf-btn cf-btn--primary" href="/contact-us/">Contact support</a>
        <a class="cf-btn cf-btn--outline" href="/">Return home</a>
      </div>
    </div>
  </div>
</section>
`;

export const recentPostsBlog = () => `<div class="cf-sidebar__card cf-recent-posts">
  <h2 class="cf-sidebar__title">Recent posts</h2>
  <ul class="cf-sidebar__links">
    <li><a href="/sole-trader-vs-limited-company/">Sole Trader vs Limited Company</a></li>
    <li><a href="/guide-to-companies-house-search/">Guide to Companies House Search: What is Companies House?</a></li>
    <li><a href="/uk-tax-identification-number-guide/">The Ultimate Essential Guide to Tax Identification Numbers</a></li>
  </ul>
</div>
`;

/** Legacy right-hand column (used by the authenticated / sidebar layouts). */
export const sidebarBanners = () => `<div class="cf-sidebar__card">
  <h2 class="cf-sidebar__title">Company changes</h2>
  <a class="cf-btn cf-btn--outline cf-btn--block cf-btn--sm" href="/company-name-change/">Company Name Change</a>
  <a class="cf-btn cf-btn--outline cf-btn--block cf-btn--sm" href="/company-closure/">Closing a Company</a>
</div>
<div class="cf-sidebar__card">
  <h2 class="cf-sidebar__title">Banking &amp; accountancy</h2>
  <a class="cf-btn cf-btn--soft cf-btn--block cf-btn--sm" href="/free-business-banking/">Free business banking</a>
  <a class="cf-btn cf-btn--soft cf-btn--block cf-btn--sm" href="http://www.121accountancy.co.uk/" target="_blank" rel="noopener">121 Accountancy</a>
</div>
`;

export const sidebar = () => `<aside id="right_nav" class="cf-sidebar" aria-label="Account">
  ##SIDEBAR_TOP#

  <div class="cf-sidebar__card" id="SidebarLoginBox">
    <form action="/login/" method="post">
      <input type="hidden" name="pa" value="login" />
      <input type="hidden" name="k" value="" />
      <h2 class="cf-sidebar__title" id="efLoginBoxHeader">Login</h2>
      <div id="efLoginBoxContent">
        <p>
          <label for="efUsernameField">Email</label>
          <input class="efTextInput" name="un" type="text" id="efUsernameField" />
        </p>
        <p>
          <label for="efPasswordField">Password</label>
          <input class="efTextInput" type="password" name="pd" id="efPasswordField" />
        </p>
        <p><button type="submit" class="cf-btn cf-btn--primary cf-btn--block">Login</button></p>
        <p><a href="/login">Forgotten password?</a></p>
        <p>New user? <a href="/register"><strong>Register now</strong></a></p>
      </div>
    </form>
  </div>

  ##SIDEBAR_BANNERS#
</aside>
`;

export const sidebarAuthenticated = () => `<aside id="right_nav" class="cf-sidebar" aria-label="My account">
  ##SIDEBAR_TOP#

  <div class="cf-sidebar__card" id="SidebarLoginBox">
    <h2 class="cf-sidebar__title" id="efLoginBoxHeader">My Account</h2>
    <div id="efLoginBoxContent">
      <p>Logged in as <strong>##USER_NAMESTRING#</strong></p>
      <ul class="cf-sidebar__links">
        <li><a href="/account/">My Account</a></li>
        <li><a href="/companies/">View All Companies</a></li>
        <li><a href="/company-add/">Import Company</a></li>
        <li><a href="/?gle=logout">Logout</a></li>
      </ul>
    </div>
  </div>

  ##SIDEBAR_BANNERS#
</aside>
`;

export const sidebarNoLogin = () => `<aside id="right_nav" class="cf-sidebar" aria-label="Help">
  ##SIDEBAR_TOP# ##SIDEBAR_BANNERS#
</aside>
`;
