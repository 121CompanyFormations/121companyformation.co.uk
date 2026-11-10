/**
 * Move all cf-breadcrumbs--solo strips into the preceding hero,
 * matching Contact / About / Packages pages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = path.join(ROOT, "pages");

const crumbBlock = (current) => `    <nav class="cf-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="cf-breadcrumbs__sep" aria-hidden="true">/</span>
      <span class="cf-breadcrumbs__current">${current}</span>
    </nav>
`;

let ok = 0;
let skip = 0;

for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith("-content.html"))) {
  const full = path.join(PAGES, file);
  let html = fs.readFileSync(full, "utf8");
  if (!html.includes("cf-breadcrumbs--solo")) {
    skip++;
    continue;
  }

  const solo = html.match(
    /<nav class="cf-breadcrumbs cf-breadcrumbs--solo"[\s\S]*?<\/nav>\s*/i
  );
  if (!solo) {
    skip++;
    continue;
  }

  const currentMatch = solo[0].match(
    /cf-breadcrumbs__current">([^<]+)</
  );
  const current = currentMatch ? currentMatch[1].trim() : "Page";
  const crumbs = crumbBlock(current);

  // Remove solo strip
  html = html.replace(solo[0], "");

  // Inject into package-style hero (row container)
  if (
    /cf-page-hero--package[\s\S]*?<div class="cf-container cf-page-hero__row">/i.test(
      html
    )
  ) {
    html = html.replace(
      /(<section class="cf-page-hero cf-page-hero--package"[\s\S]*?>)\s*<div class="cf-container cf-page-hero__row">/i,
      `$1
  <div class="cf-container">
${crumbs}    <div class="cf-page-hero__row">`
    );
    // close the extra container after the row
    html = html.replace(
      /(<div class="cf-page-hero__row">[\s\S]*?<\/div>)\s*<\/section>/i,
      `$1
  </div>
</section>`
    );
  } else if (
    /cf-namesearch-hero[\s\S]*?<div class="cf-container cf-namesearch-hero__inner">/i.test(
      html
    )
  ) {
    html = html.replace(
      /(<div class="cf-container cf-namesearch-hero__inner">)/i,
      `$1
${crumbs}`
    );
  } else if (
    /<section class="cf-page-hero"[\s\S]*?<div class="cf-container cf-page-hero__inner">/i.test(
      html
    )
  ) {
    html = html.replace(
      /(<div class="cf-container cf-page-hero__inner">)/i,
      `$1
${crumbs}`
    );
  } else {
    console.log(`SKIP structure ${file}`);
    skip++;
    continue;
  }

  fs.writeFileSync(full, html, "utf8");
  console.log(`OK  ${file}`);
  ok++;
}

console.log(`\nDone. updated=${ok} skip=${skip}`);
