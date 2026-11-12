/**
 * Apply package-style hero + product pricing card to service pages
 * that have a buy/price card on the live site.
 *
 * Usage: node scripts/apply-service-pricing.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const BLOCKS = path.join(ROOT, "prod-effiling", "blocks");
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "service-pricing-catalog.json"), "utf8")
);

function stripBlockComment(html) {
  return html.replace(/^<!-- Block:.*?-->\s*/m, "");
}

function readBlock(name) {
  return stripBlockComment(
    fs.readFileSync(path.join(BLOCKS, `${name}.html`), "utf8")
  );
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractProse(html) {
  const m = html.match(/<div class="cf-prose">([\s\S]*?)<\/div>\s*(?:##SERVICE_SIDEBAR#|<aside\b)/i);
  if (m) return m[1].trim();
  // already transformed with custom aside: grab prose until aside
  const m2 = html.match(/<div class="cf-prose">([\s\S]*?)<\/div>\s*<aside\b/i);
  if (m2) return m2[1].trim();
  throw new Error("Could not extract .cf-prose");
}

function extractCrumb(html, fallback) {
  const m = html.match(/cf-breadcrumbs__current">([^<]+)</);
  return m ? m[1].trim() : fallback;
}

function buildPage(item, prose, crumb) {
  const priceNote = item.priceNote
    ? ` <small>${esc(item.priceNote)}</small>`
    : "";
  const heroPrice = `${esc(item.priceLabel)} <strong>${esc(item.price)}</strong>${
    item.priceNote ? ` <span class="cf-page-hero__price-note">${esc(item.priceNote)}</span>` : ""
  }`;
  const blurb = item.blurb
    ? `<p class="cf-pkg-summary__note">${esc(item.blurb)}</p>`
    : "";
  const benefits = (item.benefits || [])
    .map((b) => `<li>${esc(b)}</li>`)
    .join("\n            ");

  const contact = readBlock("SIDEBAR_CONTACT");
  const packages = readBlock("SIDEBAR_PACKAGES");

  return `<!-- PAGE_CONTENT for /${item.slug}/ – service detail with price CTA -->
<section class="cf-page-hero cf-page-hero--package" aria-label="Page header">
  <div class="cf-container">
    <nav class="cf-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      <span class="cf-breadcrumbs__current">${esc(crumb)}</span>
    </nav>
    <div class="cf-page-hero__row">
      <div class="cf-page-hero__copy">
        <h1 class="cf-page-hero__title">${esc(item.title)}</h1>
        <p class="cf-page-hero__price">${heroPrice}</p>
      </div>
      <a class="cf-btn cf-btn--light" href="${esc(item.ctaHref)}">${esc(item.ctaLabel)}</a>
    </div>
  </div>
</section>
<section class="cf-section">
  <div class="cf-container">
    <div class="cf-split">
    <div class="cf-prose">
${prose}
    </div>
    <aside class="cf-sidebar" aria-label="Service pricing and help">
      <div class="cf-pkg-summary">
        <div class="cf-pkg-summary__head">
          <h2 class="cf-pkg-summary__name">${esc(item.cardTitle)}</h2>
          <p class="cf-pkg-summary__price">${esc(item.price)}${priceNote}</p>
        </div>
        <div class="cf-pkg-summary__body">
          <h3 class="cf-pkg-summary__label">${esc(item.benefitsLabel)}</h3>
          ${blurb}
          <ul>
            ${benefits}
          </ul>
          <a class="cf-btn cf-btn--primary cf-btn--block" href="${esc(item.ctaHref)}">${esc(item.ctaLabel)}</a>
        </div>
      </div>
${contact}
${packages}
    </aside>
    </div>
  </div>
</section>
`;
}

let ok = 0;
let skip = 0;
for (const item of catalog) {
  const file = path.join(PAGES, `${item.slug}-content.html`);
  if (!fs.existsSync(file)) {
    console.log(`MISS ${item.slug}`);
    skip++;
    continue;
  }
  const raw = fs.readFileSync(file, "utf8");
  let prose;
  try {
    prose = extractProse(raw);
  } catch (err) {
    console.log(`FAIL ${item.slug}: ${err.message}`);
    skip++;
    continue;
  }
  const crumb = extractCrumb(raw, item.title);
  const out = buildPage(item, prose, crumb);
  fs.writeFileSync(file, out, "utf8");
  console.log(`OK   /${item.slug}/  ${item.price}`);
  ok++;
}

console.log(`\nDone. updated=${ok} skip=${skip}`);
