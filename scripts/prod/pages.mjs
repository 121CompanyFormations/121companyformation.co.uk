/**
 * Page assembly for prod-effiling/pages.
 *
 * Every page of the live export is written back in the same .yml shape (same URL, templates,
 * custom fields and SEO meta) with a redesigned Body:
 *
 *   tier 1  redesigned content exists in pages/<slug>-content.html  → used as the Body
 *   tier 2  no redesigned content (legacy / orphan pages)           → old copy converted to the new markup
 *   tier 3  platform pages (login, cart, checkout …)                → ##PAGE_CONTENT# stays, old wrappers removed
 *
 * JSON-LD is always preserved (cleaned / updated, see jsonld.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  BACKUP,
  SITE,
  read,
  parsePage,
  getField,
  plain,
  setField,
  yamlScalar,
  serializePage,
  mapAssets,
  restorePriceTokens,
  useWhatsappBlock,
  stripLeadingComment,
  escapeHtml,
  textOnly,
  walk,
  rel,
} from "./lib.mjs";
import { extractLd, parseLd, clean, ldScript, LOGO, ORG_NAME, PACKAGE_PRICES } from "./jsonld.mjs";
import { convertLegacy } from "./legacy.mjs";
import { projectBlock } from "./blocks.mjs";

const PROJECT_PAGES = path.join(ROOT, "pages");
const CATALOG = JSON.parse(read(path.join(ROOT, "scripts", "service-pricing-catalog.json")));

export const report = { tier1: [], tier2: [], tier3: [], newPages: [], ld: [], notes: [] };

/* ------------------------------------------------------------------ helpers */

const indent = (html, n) =>
  html
    .split("\n")
    .map((l) => (l ? " ".repeat(n) + l : l))
    .join("\n");

function crumbsHtml(crumbs) {
  return crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<span class="cf-breadcrumbs__current">${escapeHtml(c.label)}</span>`
        : `<a href="${c.href}">${escapeHtml(c.label)}</a>\n      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>`
    )
    .join("\n      ");
}

export function inlineHero({ crumbs, title, lead }) {
  return `<section class="cf-page-hero" aria-label="Page header">
  <div class="cf-container cf-page-hero__inner">
    <nav class="cf-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      ${crumbsHtml(crumbs)}
    </nav>
    <h1 class="cf-page-hero__title">${escapeHtml(title)}</h1>${lead ? `\n    <p class="cf-page-hero__lead">${escapeHtml(lead)}</p>` : ""}
  </div>
</section>`;
}

const cleanTitle = (t) =>
  plain(t)
    .replace(/\s*\|\s*121\s*Company\s*Formation(\.co\.uk)?\s*$/i, "")
    .replace(/\s*\|\s*121CompanyFormation\.co\.uk\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const withSidebar = (prose, sidebar = "##SERVICE_SIDEBAR#") => `<section class="cf-section">
  <div class="cf-container">
    <div class="cf-split">
      <div class="cf-prose">
${indent(prose, 8)}
      </div>
      ${sidebar}
    </div>
  </div>
</section>`;

/* ------------------------------------------------------------ package data */

export function packageKey(slug) {
  const m = slug.match(/(?:^|\/)(lbs|llp|lbg)-(bronze|silver|gold|platinum|diamond)$/);
  if (m) return { group: m[1], tier: m[2] };
  if (/(?:^|\/)international-plus$/.test(slug)) return { group: "international", tier: "plus" };
  if (/(?:^|\/)international$/.test(slug)) return { group: "international", tier: "" };
  return null;
}

const priceToken = (k) =>
  k.group === "international"
    ? k.tier === "plus"
      ? "##INTERNATIONAL-PACKAGE_PLUS_Price#"
      : "##INTERNATIONAL-PACKAGE_Price#"
    : `##${k.group.toUpperCase()}-PACKAGE_${k.tier.toUpperCase()}_Price#`;

const packageSlugKey = (k) => (k.group === "international" ? (k.tier === "plus" ? "international-plus" : "international") : `${k.group}-${k.tier}`);
const packagePrice = (k) => PACKAGE_PRICES[packageSlugKey(k)];

/** Meta descriptions advertised long-gone prices (£15.95, £35.95 …): use the live price block instead. */
function fixDescPrice(desc, slug) {
  let k = packageKey(slug);
  if (!k && slug === "lbg") k = { group: "lbg", tier: "bronze" };
  if (!k && slug === "llp") k = { group: "llp", tier: "bronze" };
  if (!k) return desc;
  let out = desc;
  // "as low as £x" always meant the entry-level package of the structure
  out = out.replace(/((?:as low as|starting from|from)\s+)£\s?\d+(?:\.\d+)?/gi, (_, pre) =>
    `${pre}${priceToken(k.group === "international" ? k : { group: k.group, tier: "bronze" })}`
  );
  out = out.replace(/£\s?\d+(?:\.\d+)?/g, priceToken(k));
  // the live copy named the wrong tier for the Silver LBG page
  if (slug === "lbg-silver") out = out.replace("the bronze limited by guarantee package", "the silver limited by guarantee package");
  return out;
}

/* ------------------------------------------------------- JSON-LD assembly */

const TIERS = ["bronze", "silver", "gold", "platinum", "diamond"];

function tierOf(name) {
  const t = TIERS.find((x) => new RegExp(`\\b${x}\\b`, "i").test(name || ""));
  return t || "";
}

function forEachNode(node, fn) {
  if (Array.isArray(node)) return node.forEach((n) => forEachNode(n, fn));
  if (node && typeof node === "object") {
    fn(node);
    Object.values(node).forEach((v) => forEachNode(v, fn));
  }
}

const typesOf = (o) => (o && o["@type"] ? [].concat(o["@type"]) : []);

function setOffer(offer, price, url) {
  offer["@type"] = offer["@type"] || "Offer";
  offer.priceCurrency = "GBP";
  offer.price = price;
  if (url) offer.url = url;
  offer.availability = offer.availability || "https://schema.org/InStock";
}

/** Package pages: price + url of every Product / Service from the live price table. */
function fixPackageEntities(entities, slug, url) {
  const single = packageKey(slug);
  const groupGuess = single
    ? single.group
    : { lbg: "lbg", llp: "llp", "limited-liability-partnership-package": "llp", "limited-by-guarantee": "lbg", packages: "lbs" }[slug];
  const isProduct = (n) => typesOf(n).some((t) => /^(Product|Service)$/.test(t));

  // a package page keeps the entity of its own tier only (llp-silver carried the whole LLP product list)
  if (single && single.tier) entities = entities.filter((e) => !(isProduct(e) && tierOf(e.name) && tierOf(e.name) !== single.tier));

  for (const e of entities) {
    forEachNode(e, (n) => {
      if (!isProduct(n) || !n.offers) return;
      let k = single;
      if (!k && groupGuess) {
        const tier = tierOf(n.name);
        if (tier) k = { group: groupGuess, tier };
      }
      if (!k) return;
      const price = packagePrice(k);
      if (!price) return;
      const pageUrl = single ? url : `${SITE}/${packageSlugKey(k)}/`;
      const offers = [].concat(n.offers);
      offers.forEach((o) => setOffer(o, price, pageUrl));
      n.offers = Array.isArray(n.offers) ? offers : offers[0];
      if (typeof n.url === "string") n.url = pageUrl;
      if (typeof n.mainEntityOfPage === "string") n.mainEntityOfPage = pageUrl;
    });
    // offers that sit outside a Product/Service (e.g. WebPage.offers) on a single-package page
    if (single) {
      const price = packagePrice(single);
      forEachNode(e, (n) => {
        if (typesOf(n).includes("Offer") && n.price !== undefined && n.price !== price) setOffer(n, price, url);
      });
    }
  }
  return entities;
}

function packagesItemList(groups, name, url) {
  const items = [];
  const label = { lbs: "Limited by Shares", llp: "Limited Liability Partnership", lbg: "Limited by Guarantee", international: "International" };
  for (const g of groups) {
    const tiers = g === "international" ? [["", "International Package"], ["plus", "International Plus Package"]] : ["bronze", "gold", "platinum", "diamond"].map((t) => [t, `${t[0].toUpperCase()}${t.slice(1)} Package`]);
    for (const [tier, title] of tiers) {
      const k = { group: g, tier };
      const slug = packageSlugKey(k);
      items.push({
        "@type": "ListItem",
        position: items.length + 1,
        item: {
          "@type": "Product",
          name: g === "international" ? title : `${label[g]} – ${title}`,
          url: `${SITE}/${slug}/`,
          brand: { "@type": "Brand", name: ORG_NAME },
          offers: { "@type": "Offer", url: `${SITE}/${slug}/`, priceCurrency: "GBP", price: PACKAGE_PRICES[slug], availability: "https://schema.org/InStock" },
        },
      });
    }
  }
  return { "@context": "https://schema.org", "@type": "ItemList", name, url, numberOfItems: items.length, itemListElement: items };
}

function applyServicePrice(entities, slug) {
  const item = CATALOG.find((c) => c.slug === slug);
  if (!item) return;
  const m = String(item.price).match(/(\d+(?:\.\d+)?)/);
  const price = m ? m[1] : /free/i.test(item.price) ? "0" : null;
  if (price === null) return;
  for (const e of entities) {
    forEachNode(e, (n) => {
      if (typesOf(n).includes("Offer") && n.price !== undefined) n.price = price;
    });
  }
}

function faqFromDetails(html, name) {
  const items = [];
  for (const m of html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)) {
    const q = textOnly(m[1]);
    const a = textOnly(m[2]);
    if (q && a) items.push({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } });
  }
  return items.length ? { "@context": "https://schema.org", "@type": "FAQPage", ...(name ? { name } : {}), mainEntity: items } : null;
}

const DROP_FAQ = new Set(["lbs-gold"]); // its FAQPage described limited-by-guarantee questions that are not on the page

export function buildLd({ slug, url, backupRaws, projectRaws, bodyHtml, descText }) {
  const ctx = { url };
  let entities;
  if (projectRaws.length) entities = projectRaws.flatMap(parseLd).map((e) => clean(e, ctx)).filter(Boolean);
  else entities = backupRaws.flatMap(parseLd).map((e) => clean(e, ctx)).filter(Boolean);

  // junk / non schema.org objects (e.g. the SIC code dump pasted into help-sic-codes-2)
  entities = entities.filter((e) => e["@type"]);
  if (slug === "help-sic-codes-2") {
    entities = [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Help with SIC Codes – page 2",
        url,
        description: "Standard Industrial Classification (SIC 2007) codes, Groups G to Q, to help you choose the right code for your company registration.",
        isPartOf: { "@type": "WebSite", name: ORG_NAME, url: `${SITE}/` },
        publisher: { "@type": "Organization", name: ORG_NAME, url: `${SITE}/`, logo: LOGO },
      },
    ];
  }

  // a page-level entity describes this page (some LD blocks were copied from /name-check/…)
  for (const e of entities) {
    if (typesOf(e).some((t) => /^(WebPage|ContactPage|CollectionPage|AboutPage|CheckoutPage)$/.test(t)) && typeof e.url === "string" && e.url.startsWith(SITE) && e.url !== url) e.url = url;
  }

  // wrong / invisible FAQ markup
  if (DROP_FAQ.has(slug)) entities = entities.filter((e) => !typesOf(e).includes("FAQPage"));

  // description / name text that advertised the old prices
  const fixText = (n) =>
    forEachNode(n, (o) => {
      for (const k of ["description", "name"]) if (typeof o[k] === "string") o[k] = fixDescPrice(o[k], slug);
    });
  entities.forEach(fixText);

  // package pages
  const k = packageKey(slug);
  if (k || ["lbg", "llp", "limited-liability-partnership-package", "limited-by-guarantee"].includes(slug)) entities = fixPackageEntities(entities, slug, url);

  if (slug === "packages") entities = [packagesItemList(["lbs", "llp", "lbg", "international"], "Company formation packages", url)];
  if (slug === "lbg") entities = [packagesItemList(["lbg"], "Limited by Guarantee formation packages", url)];
  if (slug === "llp" || slug === "limited-liability-partnership-package")
    entities = [packagesItemList(["llp"], "Limited Liability Partnership formation packages", url)];

  // service prices from the pricing catalog used for the redesigned content
  applyServicePrice(entities, slug);

  // FAQ markup follows the visible (redesigned) FAQ
  if (slug === "frequently-asked-questions" || slug === "home") {
    const faq = faqFromDetails(bodyHtml, slug === "home" ? "Frequently Asked Questions" : undefined);
    if (faq) {
      entities = entities.filter((e) => !typesOf(e).includes("FAQPage"));
      // homepage.yml carried the FAQ inside a WebPage.mainEntityOfPage – flatten it
      entities.forEach((e) => {
        if (e.mainEntityOfPage && typeof e.mainEntityOfPage === "object" && typesOf(e.mainEntityOfPage).includes("FAQPage")) delete e.mainEntityOfPage;
        if (e.additionalType === "https://schema.org/FAQPage") delete e.additionalType;
      });
      entities.push(faq);
    }
  }

  // Organization-like top-level entities carry the new logo
  for (const e of entities) if (typesOf(e).some((t) => /^(Organization|LocalBusiness)$/.test(t)) && !e.logo) e.logo = LOGO;
  for (const e of entities) if (typesOf(e).includes("LocalBusiness") && (!e["@id"] || e["@id"] === "")) e["@id"] = `${SITE}/#localbusiness`;
  for (const e of entities) if (e["@id"] === "") delete e["@id"];

  // drop entities that cleaned down to an empty shell
  entities = entities.filter((e) => Object.keys(e).filter((x) => x !== "@context").length > 0);
  report.ld.push({ slug, count: entities.length });
  void descText;
  return entities.map(ldScript).join("\n");
}

/* -------------------------------------------------------- content loading */

export function projectContent(slug) {
  const file = path.join(PROJECT_PAGES, `${slug}-content.html`);
  if (!fs.existsSync(file)) return null;
  let html = stripLeadingComment(read(file));
  html = html.replace(/<!--\s*CF_SKIP_CTA\s*-->\s*/g, "");
  html = mapAssets(useWhatsappBlock(restorePriceTokens(html)));
  const { body, raws } = extractLd(html);
  return { html: body.trim(), ldRaws: raws };
}

/* ---------------------------------------------------- tier 1 special cases */

function nameCheckBody(html) {
  const i = html.indexOf('<div class="cf-namecheck-engage">');
  if (i < 0) throw new Error("name-check content without engage block");
  let engage = html.slice(i).trimEnd();
  if (engage.endsWith("</div>")) engage = engage.slice(0, -6).trimEnd(); // outer #efPageContent wrapper
  return `<div class="cf-namecheck-page">
  <div class="cf-container cf-namecheck-page__inner">
    ##PAGE_CONTENT#
  </div>
</div>

${engage}

##HELP_SECTION#
<script>
  fbq('trackCustom', 'NameSearch');
</script>`;
}

/** The redesign mock-ups the platform form; in production the real form is ##PAGE_CONTENT#. */
function contactBody(html) {
  const re = /<div class="cf-contact__form-wrap">[\s\S]*?<div class="cf-contact__form" id="efPageContent">[\s\S]*?<div id="success"([\s\S]*?)<\/div>\s*<div id="error"([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/;
  const m = html.match(re);
  if (!m) throw new Error("contact-us: form block not found");
  const replacement = `<div class="cf-contact__form-wrap">
        <div class="cf-contact__form">
          ##PAGE_CONTENT#
          <div id="success"${m[1]}</div>
          <div id="error"${m[2]}</div>
        </div>
      </div>`;
  return html.replace(re, replacement);
}

/* ------------------------------------------------------------- tier 2 */

const BLOG_SLUGS = new Set(["guide-to-companies-house-search", "sole-trader-vs-limited-company", "uk-tax-identification-number-guide"]);

function stripOldFrames(body) {
  // remove the legacy hero bands that the redesign renders as cf-page-hero
  return body.replace(/<section[^>]*class="[^"]*(?:h_action_promo_area|breadcrumb_area)[^"]*"[\s\S]*?<\/section>/gi, "");
}

function sitemapProse(body) {
  const links = [...body.matchAll(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: m[1].replace(/^https?:\/\/(?:www\.)?121companyformation\.(?:co\.uk|com)/i, "") || "/",
    text: textOnly(m[2]).replace(/\s+/g, " "),
  }));
  const seen = new Set();
  const li = links
    .filter((l) => l.text && !seen.has(l.href) && seen.add(l.href))
    .map((l) => `<li><a href="${l.href}">${escapeHtml(l.text.replace(/\b\w/g, (c) => c.toUpperCase()))}</a></li>`);
  return `<ul class="cf-sitemap">\n${li.join("\n")}\n</ul>`;
}

function sicProse(body) {
  let b = body.replace(/<td class="row_two">([\s\S]*?)<\/td>/g, '<th scope="col">$1</th>');
  b = b.replace(/<center>([\s\S]*?)<\/center>/i, "<p>$1</p>");
  return b;
}

function packageDetailBody(slug, prose) {
  const k = packageKey(slug);
  const buySlug = k.group === "international" ? (k.tier === "plus" ? "international-plus-package" : "international-package") : slug;
  const buy = `href="/name-check/${buySlug}/" onclick="packagesBuyNow('${buySlug}'); return false;"`;
  return `<section class="cf-section">
  <div class="cf-container">
    <div class="cf-split">
      <div class="cf-prose">
${indent(prose, 8)}
        <p><a class="cf-btn cf-btn--primary" ${buy}>Buy now</a></p>
      </div>
      <aside class="cf-sidebar" aria-label="Package summary and contact">
        <div class="cf-pkg-summary">
          <div class="cf-pkg-summary__head">
            <h2 class="cf-pkg-summary__name">##CUSTOM1#</h2>
            <p class="cf-pkg-summary__price">##CUSTOM2#</p>
          </div>
          <div class="cf-pkg-summary__body">
            <a class="cf-btn cf-btn--primary cf-btn--block" ${buy}>Buy Now</a>
          </div>
        </div>
        ##SIDEBAR_CONTACT#
      </aside>
    </div>
  </div>
</section>`;
}

function packageListing(group, intro) {
  const G = group.toUpperCase();
  const introSection = intro
    ? `<section class="cf-section">
  <div class="cf-container">
    <div class="cf-prose">
${indent(intro, 6)}
    </div>
  </div>
</section>
`
    : "";
  return `${introSection}<section class="cf-section cf-packages cf-packages-desktop cf-packages-compare" id="packages" aria-label="Package comparison">
  <div class="cf-container">
    <div class="cf-sec-head">
      <p class="cf-eyebrow">Packages</p>
      <h2 class="cf-h2">What we are offering</h2>
      <p class="cf-lead">Compare live package prices and inclusions side by side.</p>
    </div>
    <div class="cf-pkg-panel is-active">
##PACKAGE_PAGE_${G}_Desktop#
    </div>
  </div>
</section>
<section class="cf-section cf-packages cf-packages-mobile" id="packages-mobile" aria-label="Package comparison">
  <div class="cf-container">
    <div class="cf-pkg-panel is-active">
##PACKAGE_PAGE_${G}_Mobile#
    </div>
  </div>
</section>`;
}

function listingIntro(body) {
  // intro copy that sits above the old tab strip
  const cut = body.search(/<section[^>]*event_schedule_area/i);
  const head = cut > 0 ? body.slice(0, cut) : "";
  const { html } = convertLegacy(stripOldFrames(head));
  return html;
}

function tier2Body({ slug, url, page, backupBody }) {
  const title = plain(getField(page, "##CUSTOM1#")) || cleanTitle(getField(page, "##PAGE_TITLE#"));
  const pageTitle = cleanTitle(getField(page, "##PAGE_TITLE#"));
  const pk = packageKey(slug);

  if (BLOG_SLUGS.has(slug)) {
    const r = convertLegacy(stripOldFrames(backupBody), { removeH1: true });
    const hero = inlineHero({ crumbs: [{ label: "Blog", href: "/blog/" }, { label: pageTitle }], title: pageTitle });
    return `${hero}
<section class="cf-section">
  <div class="cf-container">
    <div class="cf-blog-layout">
      <article class="cf-blog-main cf-prose">
${indent(r.html, 8)}
      </article>
      <aside class="cf-blog-sidebar" aria-label="Blog sidebar">
        ##RECENTPOSTS_BLOG#
        ##BLOG_SIDEBAR#
      </aside>
    </div>
  </div>
</section>`;
  }

  if (slug === "help-sic-codes" || slug === "help-sic-codes-2") {
    const r = convertLegacy(sicProse(backupBody));
    return `${inlineHero({ crumbs: [{ label: "SIC codes" }], title: "Help: SIC codes table" })}
<section class="cf-section">
  <div class="cf-container">
    <div class="cf-prose">
${indent(r.html, 6)}
    </div>
  </div>
</section>`;
  }

  if (slug === "sitemap-html") {
    return withSidebar(sitemapProse(backupBody), "##SERVICE_SIDEBAR#");
  }

  if (slug === "lbg") {
    return `${inlineHero({ crumbs: [{ label: "Limited by Guarantee packages" }], title: "Limited by Guarantee packages", lead: "Choose one of our limited by guarantee formation packages and register your company name now." })}\n${packageListing("lbg")}`;
  }
  if (slug === "llp") {
    return `${inlineHero({ crumbs: [{ label: "LLP packages" }], title: "Limited Liability Partnership packages", lead: "Choose one of our LLP formation packages and register your company name now." })}\n${packageListing("llp")}`;
  }
  if (slug === "limited-liability-partnership-package") {
    return `${inlineHero({ crumbs: [{ label: "Limited Liability Partnership Package" }], title: "Limited Liability Partnership Package" })}\n${packageListing("llp", listingIntro(backupBody))}`;
  }

  if (pk && slug !== "lbs-silver") {
    const r = convertLegacy(stripOldFrames(backupBody));
    return packageDetailBody(slug, r.html);
  }

  // generic content page: hero comes from CUSTOM5 (HERO_PAGE*), prose + service sidebar here
  let r = convertLegacy(stripOldFrames(backupBody));
  r = { ...r, html: r.html.replace(/\+44 \(0\) 207 965 7266/g, "+44 (0)203 8932 121") };
  void title;
  return withSidebar(r.html);
}

/* ------------------------------------------------------------- tier 3 */

function nameCheckPackageBody() {
  return `<section class="cf-namesearch-hero" aria-labelledby="cf-namesearch-title">
  <div class="cf-container cf-namesearch-hero__inner">
    <nav class="cf-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      <a href="/name-check/">Name Check</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      <span class="cf-breadcrumbs__current">##CUSTOM1#</span>
    </nav>
    <h1 id="cf-namesearch-title" class="cf-namesearch-hero__title">##CUSTOM1#</h1>
    <p class="cf-namesearch-hero__lead">Choose your new company name</p>
    ##NAME_CHECK_FORM#
  </div>
</section>

##HELP_SECTION#
<script>
  fbq('trackCustom', 'NameSearch');
</script>`;
}

const PAGE_CONTENT_FIX = (s) => s.replace(/##PAGE_CONTENT##/g, "##PAGE_CONTENT#");

function simplePlatformBody(backupBody) {
  // keep tracking scripts and ##PAGE_CONTENT#, drop old wrappers / inline theme css
  let b = PAGE_CONTENT_FIX(backupBody);
  b = b.replace(/<style[\s\S]*?<\/style>/gi, "");
  return b.replace(/\n{3,}/g, "\n\n").trim();
}

function registerBody(backupBody) {
  let b = PAGE_CONTENT_FIX(backupBody);
  // keep the functional error box sizing; the layout rules (td input float) are in the new theme
  b = b.replace(/<style[\s\S]*?<\/style>/i, `<style type="text/css">
  #error-message,
  #success-message {
    width: 96%;
    padding: 5px;
  }
</style>`);
  b = b.replace(/^\s*<p>\s*(##PAGE_CONTENT#)\s*<\/p>/, "$1");
  return b.trim();
}

function textPage(inner) {
  return `<section class="cf-section">
  <div class="cf-container cf-prose">
${indent(inner, 4)}
  </div>
</section>`;
}

function maintenanceBody(backupBody) {
  let b = backupBody;
  b = b
    .replace("background-color:#eeeeee;", "background-color:#f5f7fb;")
    .replace("color:#616161 /*#757575*/;", "color:#5b6475;")
    .replace(/font-family: 'Noto Sans', sans-serif;/, "font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;")
    .replace("color: #f6921e;", "color: #e8461e;")
    .replace("border-radius:5px;", "border-radius:14px;")
    .replace(/https:\/\/fonts\.googleapis\.com\/css\?family=Noto\+Sans:400,700/, "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=Montserrat:wght@700&amp;display=swap")
    .replace(/(h1\{\s*font-size:32px;\s*font-weight:400;)/, "h1{\n  font-family:'Montserrat','Inter',sans-serif;\n  color:#0b1530;\n  font-size:32px;\n  font-weight:700;");
  return PAGE_CONTENT_FIX(b);
}

/* ---------------------------------------------------------------- driver */

const TIER3_SIMPLE = new Set([
  "login",
  "cart",
  "checkout",
  "password-reset",
  "processed-mail",
  "unsubscribe",
  "update-lead",
  "upgrade",
  "remarketing",
  "payment-gateway",
  "address-services",
  "company-details/officer/terminate",
]);

export function buildPage(file) {
  const slug = rel(path.join(BACKUP, "pages"), file).replace(/\.yml$/, "");
  const page = parsePage(read(file));
  const urlPath = plain(getField(page, "URL"));
  const url = SITE + urlPath;
  const { body: backupBody, raws: backupRaws } = extractLd(page.body);
  const contentSlug = slug === ".root" || slug === "homepage" ? "home" : slug;
  const project = projectContent(contentSlug);

  let body;
  let tier;
  let projectRaws = [];

  if (slug === ".root" || slug === "homepage") {
    tier = 1;
    body = project.html.replace(/^\s*<!--[\s\S]*?-->\s*/, "");
    // the home content is only block placeholders; FAQ JSON-LD follows the visible FAQ_HOME block
    body = body.replace(/\n{3,}/g, "\n\n").trim();
  } else if (project) {
    tier = 1;
    projectRaws = project.ldRaws;
    body = project.html;
    if (slug === "name-check") body = nameCheckBody(body);
    if (slug === "contact-us") body = contactBody(body);
    setField(page, "##CUSTOM5#", ""); // hero is part of the content
  } else if (slug === "name-check/" || /^name-check\//.test(slug) || slug === "v") {
    tier = 3;
    body = nameCheckPackageBody();
  } else if (TIER3_SIMPLE.has(slug)) {
    tier = 3;
    body = simplePlatformBody(backupBody);
  } else if (slug === "register") {
    tier = 3;
    body = registerBody(backupBody);
  } else if (slug === "buy") {
    tier = 3;
    body = PAGE_CONTENT_FIX(backupBody).trim();
  } else if (slug === "products" || slug === "contact-request-form") {
    tier = 3;
    body = textPage('<p>Go back to <a href="/">Homepage</a>.</p>');
  } else if (slug === "maintenance") {
    tier = 3;
    body = maintenanceBody(backupBody);
  } else {
    tier = 2;
    body = tier2Body({ slug, url, page, backupBody });
    if (BLOG_SLUGS.has(slug) || ["lbg", "llp", "limited-liability-partnership-package", "help-sic-codes", "help-sic-codes-2"].includes(slug)) {
      setField(page, "##CUSTOM5#", "");
    }
  }

  // CUSTOM5 that holds plain text (e.g. "About Us") would be printed by the Layout
  const c5 = plain(getField(page, "##CUSTOM5#"));
  if (c5 && !/^##[A-Za-z0-9_]+#$/.test(c5)) setField(page, "##CUSTOM5#", "");

  // meta descriptions with stale package prices → live price blocks
  const descRaw = getField(page, "##PAGE_DESCRIPTION#");
  if (descRaw !== undefined) {
    const d = plain(descRaw);
    const fixed = fixDescPrice(d, slug);
    if (fixed !== d) setField(page, "##PAGE_DESCRIPTION#", yamlScalar(fixed));
  }

  const ld = buildLd({
    slug: contentSlug === "home" ? "home" : slug,
    url,
    backupRaws,
    projectRaws,
    bodyHtml: contentSlug === "home" ? projectBlock("FAQ_HOME") : body,
  });

  body = `${body.replace(/\s+$/, "")}\n${ld ? "\n" + ld : ""}`;
  (tier === 1 ? report.tier1 : tier === 2 ? report.tier2 : report.tier3).push(slug);
  return { slug, text: serializePage(page, body) };
}

/** Pages that exist only in the redesign (not in the live export). */
export function buildNewPages() {
  const out = [];
  const blog = projectContent("blog");
  if (blog) {
    const tpl = parsePage(read(path.join(BACKUP, "pages", "frequently-asked-questions.yml")));
    const page = { head: tpl.head.map((h) => ({ ...h })), body: "" };
    setField(page, "##PAGE_TITLE#", "Blog | 121CompanyFormation.co.uk");
    setField(page, "##PAGE_DESCRIPTION#", yamlScalar("Guides and advice on UK company formation, choosing a company structure, Companies House and tax."));
    setField(page, "##PAGE_KEYWORDS#", '"##CONTENT_PAGE_KEYWORDS#"');
    setField(page, "##CUSTOM1#", "Blog");
    setField(page, "##CUSTOM5#", "");
    if (getField(page, "##CUSTOM2#") !== undefined) setField(page, "##CUSTOM2#", "");
    if (getField(page, "##CUSTOM4#") !== undefined) setField(page, "##CUSTOM4#", "");
    setField(page, "URL", "/blog/");
    const ldEntities = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Blog – 121 Company Formation",
        url: `${SITE}/blog/`,
        description: "Guides and advice on UK company formation, choosing a company structure, Companies House and tax.",
        isPartOf: { "@type": "WebSite", name: ORG_NAME, url: `${SITE}/` },
      },
    ];
    const text = serializePage(page, `${blog.html}\n\n${ldEntities.map(ldScript).join("\n")}`);
    out.push({ slug: "blog", text });
    report.newPages.push("blog");
  }
  return out;
}

export function allBackupPages() {
  return walk(path.join(BACKUP, "pages"))
    .filter((f) => f.endsWith(".yml"))
    .sort();
}
