# prod-effiling

The redesign laid out **exactly like the live eFiling export** (`../prod-backup/prod-backup`):
the same `blocks/*.html` and `pages/**/*.yml`, with the new design and content.
This folder is **generated** – do not edit it by hand, change the sources and run:

```bash
npm run build:prod      # = node scripts/build-prod-effiling.mjs
# PROD_BACKUP=<path to prod-backup/prod-backup> if the export lives elsewhere
```

| Folder | What it is |
|---|---|
| `blocks/` | 79 blocks – every live block (same name), redesigned / restyled / copied, plus 10 new ones |
| `pages/` | 113 pages – every live page (same URL, templates, SEO meta, CUSTOM fields) with a redesigned Body, plus `/blog/` |
| `layout/Layout.html` | the Layout template (templates are **not** part of the export – see "Layout" below) |
| `assets/custom/files/` | `app_min.css`, `app_min.js` (compiled from `css/cf-site.css` + `dev/static/scss` + `dev/static/js`) → Asset Manager |
| `assets/custom/images/` | logos + favicon → Asset Manager |

Current asset versions used by the `CSS` / `JAVASCRIPT` blocks: `app_min.css?v=2723d81f89`, `app_min.js?v=7d8b6edc77`
(content hash – the blocks are regenerated with the new hash on every build).

## Deploy order

1. **Asset Manager** – upload `assets/custom/files/app_min.css` + `app_min.js` to `/assets/custom/files/` and everything in `assets/custom/images/` to `/assets/custom/images/`.
   *The live site loads `app_min.js?v69` and `app_min_full.css`. Uploading the new `app_min.js` overwrites the live script so do this as part of the cut-over, not days before.*
2. **Blocks** – import `blocks/` (all of them; `CSS` and `JAVASCRIPT` carry the new asset versions).
3. **Layout** – paste `layout/Layout.html` into Theme → Templates → Layout.
4. **Pages** – import `pages/`.
5. Remove the blocks listed under "Not shipped" once nothing references them (the export of the new site no longer does).

## Layout

`layout/Layout.html` is the redesign Layout with two production fixes versus `../layout/Layout.html`:
the body class comes from `##CUSTOM4#` (live pages use CUSTOM4 for `packages-page`, `name-check`, `contact-us-page` …, which looks like the body-class field of the live Layout – the redesign CSS keys off `body.name-check` / `body.packages-page`; verify against the live Layout), and `##CSS#` is in `<head>`.
The other templates referenced by pages (`Layout Authenticated`, `Layout No Sidebar`, `Efiling - Blank Template`, `Efiling - Default Payment Page - New`) are not in the export and were **not** touched – they must render `##HEADER_Authenticated#` / `##SIDEBAR_AUTHENTICATED#` etc. as before; those blocks are redesigned.

## Blocks

**From the redesign (same name, new markup)** – `HEADER`, `HEADER_TOP`, `HEADER_NAV`, `HERO_Homepage`, `Services`, `HOME_PACKAGES_DESKTOP`, `HOME_PACKAGES_MOBILE`, `HOME_PACKAGES_COMPARE`, `HELP_SECTION`, `YOUTUBE_SECTION`, `HOW_IT_WORKS`, `BANKING_PARTNERS`, `POPULAR_SERVICES`, `WHY_US`, `FAQ_HOME`, `FOOTER_Register`, `SERVICE_SIDEBAR`, `SIDEBAR_CONTACT`, `SIDEBAR_PACKAGES`, `BLOG_SIDEBAR`, `PACKAGE_PAGE_LBS_Desktop`, `PACKAGE_PAGE_LBS_Mobile`, `PACKAGE_PAGE_LLP_Desktop`, `PACKAGE_PAGE_LLP_Mobile`, `PACKAGE_PAGE_LBG_Desktop`, `PACKAGE_PAGE_LBG_Mobile`, `PACKAGE_PAGE_INTERNATIONAL_Desktop`, `PACKAGE_PAGE_INTERNATIONAL_Mobile`.
`FOOTER` is the redesign footer plus the *Refund Policy* link that the live footer had.

**Restyled in place (same name / variables, new design)** – `HEADER_Authenticated`, `HEADER_NAV_Authenticated`, `FOOTER`, `CSS`, `JAVASCRIPT`, `HTML_HEAD`, `PRELOADER`, `COOKIES`, `INITIAL_CHECKOUT_CSS`, `NAME_CHECK_FORM`, `HERO_PAGE`, `HERO_PAGE_Services`, `HERO_PAGE_Services2`, `HERO_PAGE_Help`, `BUY_UNAVAILABLE`, `RECENTPOSTS_BLOG`, `SIDEBAR`, `SIDEBAR_AUTHENTICATED`, `SIDEBAR_NO_LOGIN`, `SIDEBAR_BANNERS`.
- `HERO_PAGE`, `HERO_PAGE_Services`, `HERO_PAGE_Services2`, `HERO_PAGE_Help` keep working as `CUSTOM5` heroes (title `##CUSTOM1#`, package price `##CUSTOM2#`, buy link `/name-check##PAGE_URL#`). Pages with a hand-written hero in their content have `CUSTOM5` cleared so the hero is not rendered twice.
- `HEADER_NAV_Authenticated` = the redesign nav + an *Account* menu (account / orders / companies / services / finances / logout, the links of the old `HEADER_NAV_MENU_Account`).
- `COOKIES`, `PRELOADER`, `BUY_UNAVAILABLE`, `SIDEBAR*`, `RECENTPOSTS_BLOG`, `NAME_CHECK_FORM`: same behaviour and platform variables, new look.

**Copied unchanged** (tracking, chat, data, prices) – `BING_GLOBAL_TAG`, `CONTENT_PAGE_KEYWORDS`, `COPY_YEAR`, `FB_PIXEL`, `FRESHCHAT`, `GA1`, `GOOGLE_ANALYTICS`, `Google_TM_Global`, `INITIAL_CHECKOUT_JS`, `LIVECHAT`, `SITE_MESSAGE_`, `WHATSAPP_NUMBER`, `REGISTERED_OFFICE_ADDRESS_PRICE`, `TRADE_MAIL_FORWARDING_Price`, `LBS-PACKAGE_BRONZE_Price`, `LBS-PACKAGE_SILVER_Price`, `LBS-PACKAGE_GOLD_Price`, `LBS-PACKAGE_PLATINUM_Price`, `LBS-PACKAGE_DIAMOND_Price`, `LBG-PACKAGE_BRONZE_Price`, `LBG-PACKAGE_SILVER_Price`, `LBG-PACKAGE_GOLD_Price`, `LBG-PACKAGE_PLATINUM_Price`, `LBG-PACKAGE_DIAMOND_Price`, `LLP-PACKAGE_BRONZE_Price`, `LLP-PACKAGE_SILVER_Price`, `LLP-PACKAGE_GOLD_Price`, `LLP-PACKAGE_PLATINUM_Price`, `LLP-PACKAGE_DIAMOND_Price`, `INTERNATIONAL-PACKAGE_Price`, `INTERNATIONAL-PACKAGE_PLUS_Price`.
Package prices stay in the `*-PACKAGE_*_Price` blocks; the redesign content uses those placeholders (the static preview had them inlined).

**New blocks** – `BANKING_PARTNERS`, `BLOG_SIDEBAR`, `FAQ_HOME`, `HOME_PACKAGES_COMPARE`, `HOW_IT_WORKS`, `POPULAR_SERVICES`, `SERVICE_SIDEBAR`, `SIDEBAR_CONTACT`, `SIDEBAR_PACKAGES`, `WHY_US`.

### Not shipped (superseded or obsolete)

| Live block | Why |
|---|---|
| `ACS_CSS` | old theme helper classes (.heading-1, .content-1, .hov …) – markup no longer exists |
| `Banking` | replaced by BANKING_PARTNERS |
| `CSS_TEASERS` | old hero/register teasers; the still-relevant rules moved to dev/static/scss/efilling/_legacy-prod.scss |
| `FAQ` | replaced by FAQ_HOME |
| `HEADER_NAV_BUTTON` | logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated |
| `HEADER_NAV_LOGO` | logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated |
| `HEADER_NAV_MENU` | logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated |
| `HEADER_NAV_MENU_Account` | account menu is part of HEADER_NAV_Authenticated |
| `HEADER_NAV_MENU_Login` | Sign in button is part of HEADER_NAV |
| `HEADER_NAV_MENU_ul` | logo + menu + button are now one block: HEADER_NAV / HEADER_NAV_Authenticated |
| `HOME_LBS_PACKAGE_li` | old home package list item |
| `HOME_PACKAGES` | old home packages wrapper (HOME_PACKAGES_DESKTOP / _MOBILE / HOME_PACKAGES_COMPARE replace it) |
| `HOME_Services` | replaced by POPULAR_SERVICES |
| `PACKAGE_BRONZE_` | old package card (replaced by the package tables) |
| `PACKAGE_DIAMOND_` | old package card (replaced by the package tables) |
| `PACKAGE_GOLD_` | old package card (replaced by the package tables) |
| `PACKAGE_PAGE_INTERNATIONAL` | old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE) |
| `PACKAGE_PAGE_INTERNATIONAL_Li` | old list items (the redesigned *_Mobile blocks are self-contained) |
| `PACKAGE_PAGE_INTERNATIONAL_PLUS_Li` | old list items (the redesigned *_Mobile blocks are self-contained) |
| `PACKAGE_PAGE_LBG` | old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE) |
| `PACKAGE_PAGE_LBG_Li` | old list items (the redesigned *_Mobile blocks are self-contained) |
| `PACKAGE_PAGE_LBS` | old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE) |
| `PACKAGE_PAGE_LBS_Li` | old list items (the redesigned *_Mobile blocks are self-contained) |
| `PACKAGE_PAGE_LLP` | old wrapper (tabs now live in HOME_PACKAGES_COMPARE / HOME_PACKAGES_MOBILE) |
| `PACKAGE_PAGE_LLP_Li` | old list items (the redesigned *_Mobile blocks are self-contained) |
| `PACKAGE_PLATINUM_` | old package card (replaced by the package tables) |
| `PACKAGE_SILVER_` | old package card (replaced by the package tables) |

## CSS

- `CSS` now links only `app_min.css`; the old inline `##CSS_TEASERS#` / `##ACS_CSS#` blocks are gone.
- **Moved** into `dev/static/scss/efilling/_legacy-prod.scss` (compiled into `app_min.css`): `#efEmulationWidget`, the `.ef-16-item-*` order-wizard fixes, the checkout *optional products* info tooltip (`INITIAL_CHECKOUT_CSS`), plus `.site-message` (the `SITE_MESSAGE_` banner), `body.packages-page .cf-cta` and the account-menu alignment.
- **Deleted** (styled markup that no longer exists): the contact / register teaser backgrounds, `.packages-page h5.pr_title`, the `.step-complete+div` colour (unreadable on the new navy order bar), `.contact_info_item`, `.heading-1`, `.content-1`, `.hov`, `.subscribe`, `.acs121hover`, … and every per-page `<style>` (`p.brdcumb`, `h1.f_p…`, list/arrow styles).
- `INITIAL_CHECKOUT_CSS` is kept as an empty block because the checkout template still includes it.

## Pages

Every page keeps its URL, templates, `PAGE_TITLE`, `PAGE_KEYWORDS` and CUSTOM fields. Changes: `CUSTOM5` cleared where the redesign content carries its own hero (or held plain text), `PAGE_DESCRIPTION` prices replaced by the live price blocks, `##PAGE_CONTENT##` (double `#`, printed a stray "#") normalised to `##PAGE_CONTENT#`.

| Tier | Pages | Body |
|---|---|---|
| 1 – redesigned content (49) | home (`/` and `/homepage/`), packages, LBS packages, services, guides, about, contact, FAQ, legal, name-check, 404 … | `pages/*-content.html` of the redesign. `/name-check/` and `/contact-us/` use the real platform slot `##PAGE_CONTENT#` (the redesign files mock it for the preview). |
| 2 – legacy pages converted (28) | `business-telephone-services`, `closing-a-company`, `company-name-chang`, `free-business-banking`, `guide-to-companies-house-search`, `help-sic-codes-2`, `help-sic-codes`, `international-plus`, `international`, `issue-of-shares`, `lbg-bronze`, `lbg-diamond`, `lbg-gold`, `lbg-platinum`, `lbg-silver`, `lbg`, `limited-by-guarantee`, `limited-liability-partnership-package`, `llp-bronze`, `llp-diamond`, `llp-gold`, `llp-platinum`, `llp-silver`, `llp`, `sitemap-html`, `sole-trader-vs-limited-company`, `uk-tax-identification-number-guide`, `vat` | old copy kept, rebuilt in the new markup (prose + sidebar, FAQ accordions → `<details>`, tables, package pages with price/Buy now, LBG/LLP listings → the redesign package tables, blog posts → blog layout, sitemap → list). |
| 3 – platform pages (35) | `address-services`, `buy`, `cart`, `checkout`, `company-details/officer/terminate`, `contact-request-form`, `login`, `maintenance`, `name-check/international-plus`, `name-check/international`, `name-check/lbg-bronze`, `name-check/lbg-diamond`, `name-check/lbg-gold`, `name-check/lbg-platinum`, `name-check/lbg-silver`, `name-check/lbs-bronze`, `name-check/lbs-diamond`, `name-check/lbs-gold`, `name-check/lbs-platinum`, `name-check/lbs-silver`, `name-check/llp-bronze`, `name-check/llp-diamond`, `name-check/llp-gold`, `name-check/llp-platinum`, `name-check/llp-silver`, `password-reset`, `payment-gateway`, `processed-mail`, `products`, `register`, `remarketing`, `unsubscribe`, `update-lead`, `upgrade`, `v` | `##PAGE_CONTENT#`, tracking scripts and the register-form script stay; old wrappers/inline CSS removed. `/name-check/{package}/` get the redesign search hero + `##NAME_CHECK_FORM#`. |
| new (1) | `blog` | `/blog/` – the redesign navigation and footer link to it, the live export has no such page. |

## JSON-LD

All 98 entities of the live export are kept (one `<script>` per entity), repaired and corrected:

- invalid JSON repaired (comments, concatenated objects, trailing commas); the SIC-code dump pasted into `help-sic-codes-2` became a proper `WebPage`;
- one set of facts everywhere: phone `+44-203-8932-121`, `info@121companyformation.co.uk`, 3rd Floor, 207 Regent Street, London W1B 3HH, canonical social profiles, new logo URL, brand `121 Company Formation` (placeholders, other companies' data – "E-Filing", Blisworth address, example.com, "YourCompany", 001formationagent – removed);
- prices follow the live price blocks / `scripts/service-pricing-catalog.json` (package pages, `packages`, `lbg`, `llp`, services). Non-numeric prices ("Varies", "Starting from £10") and expired `priceValidUntil` dates were dropped;
- `packages`, `lbg`, `llp` – one `ItemList` of the package products (the old blocks mixed example.com URLs and invented ratings);
- invented content removed: `AggregateRating` / `Review` ("Jane Doe"), founders "John Doe", template `interactionStatistic` counters, `SearchAction`s that point to non-existent URLs;
- `FAQPage` of the homepage and `/frequently-asked-questions/` is generated from the FAQ that is actually visible; the FAQ copied onto `lbs-gold` (it described limited-by-guarantee) was dropped.
- Prices left as they were in the live JSON-LD because nothing on the site confirms them: `company-secretary` (99.00), `processed-mail` (25.00), officer termination (49.99), `business-telephone-services` (6.99 / 19.99).

## Needs a human look

- **Navigation**: the redesign nav/footer no longer link `/company-director/`, `/company-secretary/`, `/limited-company-shareholders/`, `/limited-by-shares/`, `/limited-by-guarantee-company/`, `/limited-liability-partnership/` (they were under *Help* in the live menu). The pages are shipped but now only reachable by URL / search.
- **Legacy copy** converted without rewriting still mentions other brands or old contact details: business-telephone-services (1st formations); company-name-chang (001 formationagent). (The old phone number in `closing-a-company` was replaced with +44 (0)203 8932 121.)
- Duplicates kept as in the export: `/homepage/` (= `/`), `/closing-a-company/` (≈ `/company-closure/`), `/company-name-chang/` (typo of `/company-name-change/`), `/business-telephone-services/`, `/terms/` (= `/terms-and-conditions/`), `/v/` (test page).
- SEO meta looks swapped on live and was kept: `/contact-us/` carries the register text, `/login/` the contact text.
- `FRESHCHAT` (copied unchanged) initialises the widget with `test@test.com` as customer e-mail.
