import { FROM_PROJECT, VERBATIM } from "./blocks.mjs";

const list = (a) => a.map((x) => `\`${x}\``).join(", ");

export function render({ cssVer, jsVer, blocks, pages, removed, newBlocks, report, REMOVED }) {
  const restyled = ["HEADER_Authenticated", "HEADER_NAV_Authenticated", "FOOTER", "CSS", "JAVASCRIPT", "HTML_HEAD", "PRELOADER", "COOKIES", "INITIAL_CHECKOUT_CSS", "NAME_CHECK_FORM", "HERO_PAGE", "HERO_PAGE_Services", "HERO_PAGE_Services2", "HERO_PAGE_Help", "BUY_UNAVAILABLE", "RECENTPOSTS_BLOG", "SIDEBAR", "SIDEBAR_AUTHENTICATED", "SIDEBAR_NO_LOGIN", "SIDEBAR_BANNERS"];

  // brand slips in legacy copy that we did not rewrite
  const slips = [];
  for (const [slug, text] of pages) {
    const body = text.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
    const m = body.match(/001 ?Formation ?Agent|1st Formations?|001formationagent/gi);
    if (m) slips.push(`${slug} (${[...new Set(m.map((x) => x.toLowerCase()))].join(", ")})`);
  }

  const removedRows = removed
    .sort()
    .map((n) => `| \`${n}\` | ${REMOVED[n] || ""} |`)
    .join("\n");

  return `# prod-effiling

The redesign laid out **exactly like the live eFiling export** (\`../prod-backup/prod-backup\`):
the same \`blocks/*.html\` and \`pages/**/*.yml\`, with the new design and content.

**Blocks live only here** (\`prod-effiling/blocks\`) – edit redesign blocks in this folder.
\`npm run build:prod\` snapshots \`blocks/\`, regenerates pages/assets/restyled/verbatim blocks, then writes redesign blocks back.

\`\`\`bash
npm run build:prod      # = node scripts/build-prod-effiling.mjs
# PROD_BACKUP=<path to prod-backup/prod-backup> if the export lives elsewhere
\`\`\`

| Folder | What it is |
|---|---|
| \`blocks/\` | ${blocks.size} blocks – single source for CMS blocks (redesign + restyled + verbatim), plus ${newBlocks.length} new ones |
| \`pages/\` | ${pages.size} pages – every live page (same URL, templates, SEO meta, CUSTOM fields) with a redesigned Body, plus \`/blog/\` |
| \`layout/Layout.html\` | the Layout template (templates are **not** part of the export – see "Layout" below) |
| \`assets/custom/files/\` | \`app_min.css\`, \`app_min.js\` (compiled from \`css/cf-site.css\` + \`dev/static/scss\` + \`dev/static/js\`) → Asset Manager |
| \`assets/custom/images/\` | logos + favicon → Asset Manager |

Current asset versions used by the \`CSS\` / \`JAVASCRIPT\` blocks: \`app_min.css?v=${cssVer}\`, \`app_min.js?v=${jsVer}\`
(content hash – the blocks are regenerated with the new hash on every build).

## Deploy order

1. **Asset Manager** – upload \`assets/custom/files/app_min.css\` + \`app_min.js\` to \`/assets/custom/files/\` and everything in \`assets/custom/images/\` to \`/assets/custom/images/\`.
   *The live site loads \`app_min.js?v69\` and \`app_min_full.css\`. Uploading the new \`app_min.js\` overwrites the live script so do this as part of the cut-over, not days before.*
2. **Blocks** – import \`blocks/\` (all of them; \`CSS\` and \`JAVASCRIPT\` carry the new asset versions).
3. **Layout** – paste \`layout/Layout.html\` into Theme → Templates → Layout.
4. **Pages** – import \`pages/\`.
5. Remove the blocks listed under "Not shipped" once nothing references them (the export of the new site no longer does).

## Layout

\`layout/Layout.html\` is the redesign Layout with two production fixes versus \`../layout/Layout.html\`:
the body class comes from \`##CUSTOM4#\` (live pages use CUSTOM4 for \`packages-page\`, \`name-check\`, \`contact-us-page\` …, which looks like the body-class field of the live Layout – the redesign CSS keys off \`body.name-check\` / \`body.packages-page\`; verify against the live Layout), and \`##CSS#\` is in \`<head>\`.
The other templates referenced by pages (\`Layout Authenticated\`, \`Layout No Sidebar\`, \`Efiling - Blank Template\`, \`Efiling - Default Payment Page - New\`) are not in the export and were **not** touched – they must render \`##HEADER_Authenticated#\` / \`##SIDEBAR_AUTHENTICATED#\` etc. as before; those blocks are redesigned.

## Blocks

**From the redesign (same name, new markup)** – ${list(FROM_PROJECT)}.
\`FOOTER\` is the redesign footer plus the *Refund Policy* link that the live footer had.

**Restyled in place (same name / variables, new design)** – ${list(restyled)}.
- \`HERO_PAGE\`, \`HERO_PAGE_Services\`, \`HERO_PAGE_Services2\`, \`HERO_PAGE_Help\` keep working as \`CUSTOM5\` heroes (title \`##CUSTOM1#\`, package price \`##CUSTOM2#\`, buy link \`/name-check##PAGE_URL#\`). Pages with a hand-written hero in their content have \`CUSTOM5\` cleared so the hero is not rendered twice.
- \`HEADER_NAV_Authenticated\` = the redesign nav + an *Account* menu (account / orders / companies / services / finances / logout, the links of the old \`HEADER_NAV_MENU_Account\`).
- \`COOKIES\`, \`PRELOADER\`, \`BUY_UNAVAILABLE\`, \`SIDEBAR*\`, \`RECENTPOSTS_BLOG\`, \`NAME_CHECK_FORM\`: same behaviour and platform variables, new look.

**Copied unchanged** (tracking, chat, data, prices) – ${list(VERBATIM)}.
Package prices stay in the \`*-PACKAGE_*_Price\` blocks; the redesign content uses those placeholders (the static preview had them inlined).

**New blocks** – ${list(newBlocks)}.

### Not shipped (superseded or obsolete)

| Live block | Why |
|---|---|
${removedRows}

## CSS

- \`CSS\` now links only \`app_min.css\`; the old inline \`##CSS_TEASERS#\` / \`##ACS_CSS#\` blocks are gone.
- **Moved** into \`dev/static/scss/efilling/_legacy-prod.scss\` (compiled into \`app_min.css\`): \`#efEmulationWidget\`, the \`.ef-16-item-*\` order-wizard fixes, the checkout *optional products* info tooltip (\`INITIAL_CHECKOUT_CSS\`), plus \`.site-message\` (the \`SITE_MESSAGE_\` banner), \`body.packages-page .cf-cta\` and the account-menu alignment.
- **Deleted** (styled markup that no longer exists): the contact / register teaser backgrounds, \`.packages-page h5.pr_title\`, the \`.step-complete+div\` colour (unreadable on the new navy order bar), \`.contact_info_item\`, \`.heading-1\`, \`.content-1\`, \`.hov\`, \`.subscribe\`, \`.acs121hover\`, … and every per-page \`<style>\` (\`p.brdcumb\`, \`h1.f_p…\`, list/arrow styles).
- \`INITIAL_CHECKOUT_CSS\` is kept as an empty block because the checkout template still includes it.

## Pages

Every page keeps its URL, templates, \`PAGE_TITLE\`, \`PAGE_KEYWORDS\` and CUSTOM fields. Changes: \`CUSTOM5\` cleared where the redesign content carries its own hero (or held plain text), \`PAGE_DESCRIPTION\` prices replaced by the live price blocks, \`##PAGE_CONTENT##\` (double \`#\`, printed a stray "#") normalised to \`##PAGE_CONTENT#\`.

| Tier | Pages | Body |
|---|---|---|
| 1 – redesigned content (${report.tier1.length}) | home (\`/\` and \`/homepage/\`), packages, LBS packages, services, guides, about, contact, FAQ, legal, name-check, 404 … | \`pages/*-content.html\` of the redesign. \`/name-check/\` and \`/contact-us/\` use the real platform slot \`##PAGE_CONTENT#\` (the redesign files mock it for the preview). |
| 2 – legacy pages converted (${report.tier2.length}) | ${list(report.tier2)} | old copy kept, rebuilt in the new markup (prose + sidebar, FAQ accordions → \`<details>\`, tables, package pages with price/Buy now, LBG/LLP listings → the redesign package tables, blog posts → blog layout, sitemap → list). |
| 3 – platform pages (${report.tier3.length}) | ${list(report.tier3)} | \`##PAGE_CONTENT#\`, tracking scripts and the register-form script stay; old wrappers/inline CSS removed. \`/name-check/{package}/\` get the redesign search hero + \`##NAME_CHECK_FORM#\`. |
| new (${report.newPages.length}) | ${list(report.newPages)} | \`/blog/\` – the redesign navigation and footer link to it, the live export has no such page. |

## JSON-LD

All ${report.ld.reduce((a, b) => a + b.count, 0)} entities of the live export are kept (one \`<script>\` per entity), repaired and corrected:

- invalid JSON repaired (comments, concatenated objects, trailing commas); the SIC-code dump pasted into \`help-sic-codes-2\` became a proper \`WebPage\`;
- one set of facts everywhere: phone \`+44-203-8932-121\`, \`info@121companyformation.co.uk\`, 3rd Floor, 207 Regent Street, London W1B 3HH, canonical social profiles, new logo URL, brand \`121 Company Formation\` (placeholders, other companies' data – "E-Filing", Blisworth address, example.com, "YourCompany", 001formationagent – removed);
- prices follow the live price blocks / \`scripts/service-pricing-catalog.json\` (package pages, \`packages\`, \`lbg\`, \`llp\`, services). Non-numeric prices ("Varies", "Starting from £10") and expired \`priceValidUntil\` dates were dropped;
- \`packages\`, \`lbg\`, \`llp\` – one \`ItemList\` of the package products (the old blocks mixed example.com URLs and invented ratings);
- invented content removed: \`AggregateRating\` / \`Review\` ("Jane Doe"), founders "John Doe", template \`interactionStatistic\` counters, \`SearchAction\`s that point to non-existent URLs;
- \`FAQPage\` of the homepage and \`/frequently-asked-questions/\` is generated from the FAQ that is actually visible; the FAQ copied onto \`lbs-gold\` (it described limited-by-guarantee) was dropped.
- Prices left as they were in the live JSON-LD because nothing on the site confirms them: \`company-secretary\` (99.00), \`processed-mail\` (25.00), officer termination (49.99), \`business-telephone-services\` (6.99 / 19.99).

## Needs a human look

- **Navigation**: the redesign nav/footer no longer link ${list(["/company-director/", "/company-secretary/", "/limited-company-shareholders/", "/limited-by-shares/", "/limited-by-guarantee-company/", "/limited-liability-partnership/"])} (they were under *Help* in the live menu). The pages are shipped but now only reachable by URL / search.
- **Legacy copy** converted without rewriting still mentions other brands or old contact details: ${slips.length ? slips.join("; ") : "none found"}. (The old phone number in \`closing-a-company\` was replaced with +44 (0)203 8932 121.)
- Duplicates kept as in the export: \`/homepage/\` (= \`/\`), \`/closing-a-company/\` (≈ \`/company-closure/\`), \`/company-name-chang/\` (typo of \`/company-name-change/\`), \`/business-telephone-services/\`, \`/terms/\` (= \`/terms-and-conditions/\`), \`/v/\` (test page).
- SEO meta looks swapped on live and was kept: \`/contact-us/\` carries the register text, \`/login/\` the contact text.
- \`FRESHCHAT\` (copied unchanged) initialises the widget with \`test@test.com\` as customer e-mail.
`;
}
