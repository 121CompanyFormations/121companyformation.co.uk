import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LIVE = path.join(ROOT, "live-html");
const PAGES = path.join(ROOT, "pages");
const BLOCKS = path.join(ROOT, "blocks");
const PREVIEW = path.join(ROOT, "preview");
const SITE = path.join(ROOT, "site");
const DOCS = path.join(ROOT, "docs");
const PAGES_DOMAIN = "redesign.121companyformation.co.uk";

const SIDEBAR_URLS = new Set([
  "/registered-office-address/",
  "/service-address/",
  "/trade-mail-forwarding/",
  "/renewals/",
  "/confirmation-statement-service/",
  "/company-closure/",
  "/company-name-change/",
  "/vat-registration/",
  "/director-appointment-and-resignation/",
  "/business-telephone-service/",
  "/transfer-of-shares/",
  "/allocation-of-shares/",
  "/certificate-of-good-standing/",
  "/business-banking/",
  "/year-end-accounts/",
  "/corporation-tax/",
  "/bookkeeping/",
  "/vat-returns/",
  "/payroll-and-paye/",
  "/dormant-company-account/",
  "/director-salary-and-dividends/",
  "/introduction-to-company-formation/",
  "/company-formation-checklist/",
  "/our-4-step-guide-to-setting-up-a-company/",
  "/post-incorporation-activities/",
  "/admin-portal-to-manage-your-companies/",
  "/online-company-name-search-tool/",
  "/company-director/",
  "/company-secretary/",
  "/limited-company-shareholders/",
  "/limited-by-shares/",
  "/limited-by-guarantee-company/",
  "/limited-liability-partnership/",
  "/lbs-bronze/",
  "/lbs-gold/",
  "/lbs-platinum/",
  "/lbs-diamond/",
]);

const PREVIEW_MAP = [
  { out: "index.html", kind: "home", title: "The Best UK Company Formation Agent | 121 Company Formation" },
  { out: "packages.html", kind: "page", page: "packages-content.html", title: "Packages | 121 Company Formation" },
  { out: "package-bronze.html", kind: "page", page: "lbs-bronze-content.html", title: "Bronze Package | 121 Company Formation" },
  { out: "service-registered-office.html", kind: "page", page: "registered-office-address-content.html", title: "Registered Office Address | 121 Company Formation" },
  { out: "guide-introduction.html", kind: "page", page: "introduction-to-company-formation-content.html", title: "Introduction to Company Formation | 121 Company Formation" },
  { out: "about.html", kind: "page", page: "about-us-content.html", title: "About Us | 121 Company Formation" },
  { out: "contact.html", kind: "page", page: "contact-us-content.html", title: "Contact Us | 121 Company Formation" },
  { out: "faq.html", kind: "page", page: "frequently-asked-questions-content.html", title: "Frequently Asked Questions | 121 Company Formation" },
  { out: "legal-privacy.html", kind: "page", page: "privacy-policy-content.html", title: "Privacy Policy | 121 Company Formation" },
];

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sid="[^"]*"/gi, "")
    .replace(/<(?:font|span|div|section|article|aside|header|footer|nav|figure|figcaption)(\s[^>]*)?>/gi, "")
    .replace(/<\/(?:font|span|div|section|article|aside|header|footer|nav|figure|figcaption)>/gi, "")
    .replace(/<br\s*\/?>/gi, "</p><p>")
    .replace(/<(?:img|input|button|iframe|svg|form|table|tr|td|th|thead|tbody)[^>]*>/gi, "")
    .replace(/<\/(?:table|tr|td|th|thead|tbody|form|button|svg)>/gi, "");
}

function tidyProse(html) {
  let s = stripNoise(html);
  s = decodeEntities(s);
  // keep only common prose tags
  s = s.replace(/<(?!\/?(?:p|h[1-6]|ul|ol|li|a|strong|b|em|i|blockquote|hr)\b)[^>]+>/gi, "");
  // drop crumb leftovers and empty icon nodes
  s = s.replace(/<p>\s*<a[^>]*>\s*Home\s*<\/a>\s*\/[^<]*<\/p>/gi, "");
  s = s.replace(/<(?:i|b|em|strong)>\s*<\/(?:i|b|em|strong)>/gi, "");
  s = s.replace(/<li>\s*<\/li>/gi, "");
  // unwrap empty
  s = s.replace(/<p>\s*<\/p>/gi, "");
  s = s.replace(/(<p>\s*)+/gi, "<p>");
  s = s.replace(/(\s*<\/p>)+/gi, "</p>");
  // collapse whitespace inside text nodes-ish
  s = s.replace(/[ \t]{2,}/g, " ");
  // normalize whitespace between tags
  s = s.replace(/>\s+</g, ">\n<");
  s = s.replace(/\n{3,}/g, "\n\n");
  // demote lone h1 in body to h2
  s = s.replace(/<h1(\b[^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");
  // absolute live links → root-relative
  s = s.replace(/https?:\/\/www\.121companyformation\.co\.uk/gi, "");
  return s.trim();
}

function textOnly(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function cleanTitle(t) {
  return t
    .replace(/\s*\|\s*121.*$/i, "")
    .replace(/\s*Home\s*\/\s*/i, "")
    .replace(/\s*The one-off fee.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGoodTitle(t) {
  if (!t) return false;
  if (t.length < 2 || t.length > 120) return false;
  // Reject leftover markup from broken live breadcrumb class matches (e.g. brdcumb">)
  if (/brdcumb|["'<>]|^\s*\/\s*$/i.test(t)) return false;
  if (/^Ready to set up/i.test(t)) return false;
  return true;
}

function titleFromUrl(url) {
  return url
    .replace(/^\/|\/$/g, "")
    .split("/")
    .filter(Boolean)
    .pop()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Page";
}

function titleFromLive(html, url) {
  const crumb = html.match(/breadcrumb_content[\s\S]{0,800}?<(?:h1|h2)[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i);
  if (crumb) {
    const t = cleanTitle(textOnly(crumb[1]));
    if (isGoodTitle(t)) return t;
  }

  // Live pages often use <p class="brdcumb">Home / Title</p>
  const br = html.match(/<p[^>]*class=["'][^"']*brdcumb[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  if (br) {
    const t = cleanTitle(textOnly(br[1]).replace(/^Home\s*\/\s*/i, ""));
    if (isGoodTitle(t)) return t;
  }

  // LBS / service promo often starts with the package/service name as first words
  const promo = html.match(/h_promo_content[^>]*>\s*([\s\S]*?)<\/div>/i);
  if (promo) {
    const t = cleanTitle(textOnly(promo[1]).split(/Home\s*\//i)[0]);
    if (isGoodTitle(t)) return t;
  }

  const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h) {
    const t = cleanTitle(textOnly(h[1]));
    if (isGoodTitle(t)) return t;
  }

  const title = html.match(/<title>([^<]+)<\/title>/i);
  if (title) {
    const t = cleanTitle(textOnly(title[1]));
    if (isGoodTitle(t)) return t;
  }

  return titleFromUrl(url);
}

function extractMain(html, url) {
  // Packages listing: keep offering + package cards region only
  if (url === "/packages/") {
    const m =
      html.match(/What we are Offering\?([\s\S]*?)(?:action_area_three|Ready to set up your company|footer_area)/i) ||
      html.match(/developer_product_area([\s\S]*?)(?:action_area_three|Ready to set up your company|footer_area)/i);
    if (m) return m[0];
  }

  const patterns = [
    /<section[^>]*case_study_details_area[\s\S]*?>([\s\S]*?)<\/section>/i,
    /<section[^>]*job_details_area[\s\S]*?<div[^>]*col-lg-8[\s\S]*?>([\s\S]*?)<\/div>\s*<div[^>]*col-lg-4/i,
    /<section[^>]*job_details_area[\s\S]*?>([\s\S]*?)<\/section>/i,
    /<div[^>]*id="page-about-us"[^>]*>([\s\S]*?)(?:<section[^>]*action_area|Ready to set up your company|<footer|footer_area)/i,
    /breadcrumb_area[\s\S]*?<\/section>([\s\S]*?)(?:<section[^>]*action_area|Ready to set up your company|footer_area|<footer)/i,
    /h_promo_content[\s\S]*?<\/section>([\s\S]*?)(?:<section[^>]*action_area|Ready to set up your company|footer_area|<footer)/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1] && m[1].length > 200) return m[1];
    if (m && m[0] && url === "/packages/" && m[0].length > 200) return m[0];
  }
  // fallback: body text-ish between header and footer
  const m = html.match(/<\/header>([\s\S]*?)(?:footer_area|<footer)/i);
  return m ? m[1] : "";
}

function extractLead(html) {
  const m = html.match(/breadcrumb_content[\s\S]{0,1200}?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (m) {
    const t = textOnly(m[1]);
    if (t && t.length > 20 && t.length < 280) return t;
  }
  return "";
}

function slugFromUrl(url) {
  if (url === "/") return "home";
  return url.replace(/^\/|\/$/g, "").replace(/\//g, "__");
}

function pageFileFromUrl(url) {
  if (url === "/") return "home-content.html";
  return `${url.replace(/^\/|\/$/g, "")}-content.html`;
}

function breadcrumbLabel(title) {
  return title;
}

function wrapPage({ url, title, lead, prose, withSidebar }) {
  const crumb = breadcrumbLabel(title);
  const sidebar = withSidebar
    ? `
    <div class="cf-split">
    <div class="cf-prose">
${prose}
    </div>
    ##SERVICE_SIDEBAR#
    </div>`
    : `
    <div class="cf-prose">
${prose}
    </div>`;

  return `<!-- PAGE_CONTENT for ${url} – synced from live HTML -->
<section class="cf-page-hero" aria-label="Page header">
  <div class="cf-container cf-page-hero__inner">
    <nav class="cf-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      <span class="cf-breadcrumbs__current">${escapeHtml(crumb)}</span>
    </nav>
    <h1 class="cf-page-hero__title">${escapeHtml(title)}</h1>
    ${lead ? `<p class="cf-page-hero__lead">${escapeHtml(lead)}</p>` : ""}
  </div>
</section>
<section class="cf-section">
  <div class="cf-container">${sidebar}
  </div>
</section>
`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PACKAGE_PRICE_TOKENS = {
  "##LBS-PACKAGE_BRONZE_Price#": "£110.95",
  "##LBS-PACKAGE_GOLD_Price#": "£192.99",
  "##LBS-PACKAGE_PLATINUM_Price#": "£242.99",
  "##LBS-PACKAGE_DIAMOND_Price#": "£506.99",
  "##LLP-PACKAGE_BRONZE_Price#": "£135.95",
  "##LLP-PACKAGE_GOLD_Price#": "£212.99",
  "##LLP-PACKAGE_PLATINUM_Price#": "£262.99",
  "##LLP-PACKAGE_DIAMOND_Price#": "£526.99",
  "##LBG-PACKAGE_BRONZE_Price#": "£135.95",
  "##LBG-PACKAGE_GOLD_Price#": "£212.99",
  "##LBG-PACKAGE_PLATINUM_Price#": "£262.99",
  "##LBG-PACKAGE_DIAMOND_Price#": "£526.99",
  "##INTERNATIONAL-PACKAGE_Price#": "£286.99",
  "##INTERNATIONAL-PACKAGE_PLUS_Price#": "£501.99",
};

function applyPackagePrices(html) {
  let out = html;
  for (const [token, value] of Object.entries(PACKAGE_PRICE_TOKENS)) {
    out = out.replaceAll(token, value);
  }
  return out;
}

function block(name) {
  let html = read(path.join(BLOCKS, `${name}.html`));
  // Expand nested ##BLOCK_NAME# placeholders one level (and again for safety).
  for (let i = 0; i < 3; i++) {
    const next = html.replace(/##([A-Z0-9_]+)#/g, (match, key) => {
      if (key in PACKAGE_PRICE_TOKENS || match.includes("PACKAGE_") && match.endsWith("_Price#")) {
        return match;
      }
      const file = path.join(BLOCKS, `${key}.html`);
      if (!fs.existsSync(file)) return match;
      return read(file).replace(/^<!-- Block:.*?-->\s*/m, "");
    });
    if (next === html) break;
    html = next;
  }
  return applyPackagePrices(html);
}

function rewritePreviewAssets(html) {
  return html
    .replaceAll('/assets/custom/images/logo-wordmark-dark.svg', '../assets/logo/logo-wordmark-dark.svg')
    .replaceAll('/assets/custom/images/logo-wordmark-light.svg', '../assets/logo/logo-wordmark-light.svg')
    .replaceAll('/assets/custom/images/favicon.ico', '../assets/logo/favicon.ico')
    .replaceAll('href="/', 'href="#/') // keep relative-ish for static demo nav
    .replaceAll('href="#/', 'href="/'); // undo - actually keep absolute paths for demo links to live-style paths
}

function localizeAssets(html, mode) {
  // mode: "preview" uses ../ relative paths; "site" uses root-absolute paths into /assets /css
  if (mode === "site") {
    return html
      .replaceAll(
        'src="/assets/custom/images/logo-wordmark-dark.svg"',
        'src="/assets/logo/logo-wordmark-dark.svg"'
      )
      .replaceAll(
        'src="/assets/custom/images/logo-wordmark-light.svg"',
        'src="/assets/logo/logo-wordmark-light.svg"'
      )
      .replaceAll(
        'src="/assets/custom/images/favicon.ico"',
        'src="/assets/logo/favicon.ico"'
      );
  }
  return html
    .replaceAll(
      'src="/assets/custom/images/logo-wordmark-dark.svg"',
      'src="../assets/logo/logo-wordmark-dark.svg"'
    )
    .replaceAll(
      'src="/assets/custom/images/logo-wordmark-light.svg"',
      'src="../assets/logo/logo-wordmark-light.svg"'
    );
}

function shellPage(title, bodyHtml, mode = "preview") {
  // Topbar scrolls away; only the main nav bar stays sticky.
  const header = `<!-- Block: HEADER -->
${block("HEADER_TOP")}
<header class="cf-header">
${block("HEADER_NAV")}
</header>`;
  const skipCta = /<!--\s*CF_SKIP_CTA\s*-->/.test(bodyHtml);
  const footer = `${skipCta ? "" : block("FOOTER_Register") + "\n"}${block("FOOTER")}`;
  const js = block("JAVASCRIPT");

  let headerLocal = localizeAssets(header, mode);
  let footerLocal = localizeAssets(footer, mode);
  let body = bodyHtml
    .replace(/<!--\s*CF_SKIP_CTA\s*-->\s*/g, "")
    .replaceAll("##SERVICE_SIDEBAR#", block("SERVICE_SIDEBAR"))
    .replaceAll("##HOME_PACKAGES_DESKTOP#", block("HOME_PACKAGES_DESKTOP"))
    .replaceAll("##HOME_PACKAGES_MOBILE#", block("HOME_PACKAGES_MOBILE"))
    .replaceAll("##HOME_PACKAGES_COMPARE#", block("HOME_PACKAGES_COMPARE"))
    .replaceAll("##PACKAGE_PAGE_LBS_Desktop#", block("PACKAGE_PAGE_LBS_Desktop"))
    .replaceAll("##PACKAGE_PAGE_LLP_Desktop#", block("PACKAGE_PAGE_LLP_Desktop"))
    .replaceAll("##PACKAGE_PAGE_LBG_Desktop#", block("PACKAGE_PAGE_LBG_Desktop"))
    .replaceAll("##PACKAGE_PAGE_INTERNATIONAL_Desktop#", block("PACKAGE_PAGE_INTERNATIONAL_Desktop"))
    .replaceAll("##PACKAGE_PAGE_LBS_Mobile#", block("PACKAGE_PAGE_LBS_Mobile"))
    .replaceAll("##PACKAGE_PAGE_LLP_Mobile#", block("PACKAGE_PAGE_LLP_Mobile"))
    .replaceAll("##PACKAGE_PAGE_LBG_Mobile#", block("PACKAGE_PAGE_LBG_Mobile"))
    .replaceAll("##PACKAGE_PAGE_INTERNATIONAL_Mobile#", block("PACKAGE_PAGE_INTERNATIONAL_Mobile"))
    .replaceAll("##HELP_SECTION#", block("HELP_SECTION"))
    .replaceAll("##YOUTUBE_SECTION#", block("YOUTUBE_SECTION"))
    .replaceAll("##BLOG_SIDEBAR#", block("BLOG_SIDEBAR"))
    .replaceAll("##BLOG_LIST#", block("BLOG_LIST"))
    .replaceAll("##CTA_BAND#", block("CTA_BAND"))
    .replaceAll("##WHATSAPP_NUMBER#", "+44 (0) 798 4046 470");
  body = applyPackagePrices(body);
  body = localizeAssets(body, mode);

  const year = String(new Date().getFullYear());
  headerLocal = headerLocal.replaceAll("##COPY_YEAR#", year);
  footerLocal = footerLocal.replaceAll("##COPY_YEAR#", year);
  body = body.replaceAll("##COPY_YEAR#", year);

  const cssHref = mode === "site" ? "/css/cf-site.css" : "../css/cf-site.css";
  const iconHref = mode === "site" ? "/assets/logo/favicon.svg" : "../assets/logo/favicon.svg";

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>${escapeHtml(title)}</title>
<link rel="icon" href="${iconHref}"/>
<link rel="stylesheet" href="${cssHref}"/>
</head>
<body class="cf-redesign">
<div class="body_wrapper">
${headerLocal}
${body}
${footerLocal}
${js}
</div>
</body>
</html>
`;
}

function homeBody() {
  return [
    block("HERO_Homepage"),
    block("Services"),
    block("HOME_PACKAGES_DESKTOP"),
    block("HOME_PACKAGES_MOBILE"),
    block("HELP_SECTION"),
    block("YOUTUBE_SECTION"),
    block("HOW_IT_WORKS"),
    block("BANKING_PARTNERS"),
    block("POPULAR_SERVICES"),
    block("WHY_US"),
    block("FAQ_HOME"),
  ].join("\n");
}

function buildHomePreview() {
  return shellPage(
    "The Best UK Company Formation Agent | 121 Company Formation",
    homeBody(),
    "preview"
  );
}

function titleFromPageFile(file, fallback) {
  try {
    const html = read(file);
    const m =
      html.match(/cf-page-hero__title">([^<]+)/) ||
      html.match(/cf-namesearch-hero__title">([^<]+)/);
    if (m) return m[1].trim();
  } catch {
    /* ignore */
  }
  return fallback;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function buildSite() {
  // Clean and recreate demo site that mirrors live URL paths
  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });

  // Static assets for absolute /css and /assets paths
  copyDir(path.join(ROOT, "css"), path.join(SITE, "css"));
  copyDir(path.join(ROOT, "assets"), path.join(SITE, "assets"));
  write(
    path.join(SITE, "serve.json"),
    JSON.stringify({ cleanUrls: true, trailingSlash: true }, null, 2)
  );

  // Homepage
  write(
    path.join(SITE, "index.html"),
    shellPage(
      "The Best UK Company Formation Agent | 121 Company Formation",
      homeBody(),
      "site"
    )
  );
  console.log("SITE /");

  // Every pages/*-content.html except home placeholder
  const files = fs
    .readdirSync(PAGES)
    .filter((f) => f.endsWith("-content.html") && f !== "home-content.html");

  for (const file of files) {
    const slug = file.replace(/-content\.html$/, "");
    // blog-post-sample → /blog/sample/ style; keep flat slug path
    let urlPath = `/${slug}/`;
    if (slug === "blog-post-sample") urlPath = "/blog/sample/";
    if (slug === "404") urlPath = "/404/";

    const pagePath = path.join(PAGES, file);
    const title = titleFromPageFile(pagePath, slug.replace(/-/g, " "));
    const html = shellPage(title, read(pagePath), "site");
    write(path.join(SITE, urlPath.replace(/^\//, ""), "index.html"), html);

    // Also support links without trailing slash by duplicating .html at path root where useful
    // e.g. /year-end-accounts (no slash) — serve finds folder if cleanUrls; write sibling file too
    const noSlashFile = path.join(SITE, `${slug}.html`);
    if (slug !== "blog-post-sample" && slug !== "404") {
      write(noSlashFile, html);
    }
    console.log(`SITE ${urlPath}`);
  }

  // Stubs for platform-only routes linked in nav
  const stub = (title, msg) =>
    shellPage(
      title,
      `<section class="cf-section"><div class="cf-container cf-prose"><h1>${escapeHtml(
        title
      )}</h1><p>${escapeHtml(
        msg
      )}</p><p><a class="cf-btn cf-btn--primary" href="/">Back to homepage</a></p></div></section>`,
      "site"
    );
  write(
    path.join(SITE, "login", "index.html"),
    stub("Sign in", "Login is a native eFiling flow and is not part of this static redesign demo.")
  );
  write(
    path.join(SITE, "register", "index.html"),
    stub(
      "Register",
      "Registration is a native eFiling flow and is not part of this static redesign demo."
    )
  );
  write(
    path.join(SITE, "blog", "index.html"),
    fs.existsSync(path.join(PAGES, "blog-content.html"))
      ? shellPage("Blog", read(path.join(PAGES, "blog-content.html")), "site")
      : stub("Blog", "The live /blog/ route currently returns 404.")
  );

  // Preview subdomain must stay out of Google (redesign.* only)
  write(
    path.join(SITE, "robots.txt"),
    "User-agent: *\nDisallow: /\n"
  );

  // GitHub Pages custom domain + publish copy in /docs (branch deploy option)
  write(path.join(SITE, "CNAME"), `${PAGES_DOMAIN}\n`);
  fs.rmSync(DOCS, { recursive: true, force: true });
  copyDir(SITE, DOCS);
  console.log(`DOCS mirror → ${path.relative(ROOT, DOCS)} (CNAME ${PAGES_DOMAIN})`);
}

function syncPages() {
  const index = JSON.parse(read(path.join(LIVE, "index.json")));
  let ok = 0;
  let skip = 0;
  for (const item of index) {
    if (item.status !== 200) {
      skip++;
      console.log(`SKIP ${item.url} (${item.status})`);
      continue;
    }
    if (item.url === "/") {
      // homepage lives in blocks; keep pages/home-content.html as placeholders only
      console.log("OK / (blocks only; home-content placeholders unchanged)");
      ok++;
      continue;
    }

    // Hand-crafted redesign pages — keep pages/*-content.html as-authored
    if (
      item.url === "/frequently-asked-questions/" ||
      item.url === "/about-us/" ||
      item.url === "/packages/" ||
      item.url === "/contact-us/" ||
      item.url === "/online-company-name-search-tool/"
    ) {
      console.log(`KEEP ${item.url} (hand-crafted content)`);
      ok++;
      continue;
    }

    const livePath = path.join(ROOT, item.file);
    if (!fs.existsSync(livePath)) {
      console.log(`MISS ${item.url}`);
      skip++;
      continue;
    }
    const html = read(livePath);
    const title = titleFromLive(html, item.url);
    const lead = extractLead(html);
    const main = extractMain(html, item.url);
    let prose = tidyProse(main);
    if (prose.length < 80) {
      // keep existing page if extraction failed badly
      console.log(`WEAK ${item.url} (kept existing if present; extracted ${prose.length} chars)`);
      skip++;
      continue;
    }

    // Preserve packagesBuyNow if present in live
    if (/packagesBuyNow\s*\(/.test(html) && !/packagesBuyNow\s*\(/.test(prose)) {
      const buy = [...html.matchAll(/packagesBuyNow\('([^']+)'\)/g)].map((m) => m[1]);
      if (buy.length) {
        prose += `\n<p><a class="cf-btn cf-btn--primary" href="javascript:void(0)" onclick="packagesBuyNow('${buy[0]}');">Buy now</a></p>`;
      }
    }

    const out = wrapPage({
      url: item.url,
      title,
      lead,
      prose,
      withSidebar: SIDEBAR_URLS.has(item.url),
    });
    const outFile = path.join(PAGES, pageFileFromUrl(item.url));
    write(outFile, out);
    console.log(`OK  ${item.url} → ${path.relative(ROOT, outFile)} (${prose.length} chars)`);
    ok++;
  }
  return { ok, skip };
}

function buildPreviews() {
  for (const item of PREVIEW_MAP) {
    let html;
    if (item.kind === "home") {
      html = buildHomePreview();
    } else {
      const pagePath = path.join(PAGES, item.page);
      if (!fs.existsSync(pagePath)) {
        console.log(`PREVIEW skip missing ${item.page}`);
        continue;
      }
      html = shellPage(item.title, read(pagePath), "preview");
    }
    write(path.join(PREVIEW, item.out), html);
    console.log(`PREVIEW ${item.out}`);
  }
}

const onlyBuild = process.argv.includes("--site-only");

if (!onlyBuild) {
  console.log("== Sync pages from live-html ==");
  const stats = syncPages();
  console.log(`\n== Build previews ==`);
  buildPreviews();
  console.log(`\n== Build site (URL mirror) ==`);
  buildSite();
  console.log(`\nDone. pages ok=${stats.ok} skip=${stats.skip}`);
} else {
  console.log("== Build site (URL mirror) ==");
  buildSite();
  console.log("\nDone.");
}
