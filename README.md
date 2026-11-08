# 121 Company Formation – redesign for eFiling Web Builder

Installation guide.  
Production-oriented build: a single CSS file + HTML split into `##NAME#` blocks.

## What you get

- `css/cf-site.css` – all styles, namespaced with the `cf-` prefix
- `css/cf-site-block.html` – the same CSS, ready to paste into the `##CSS#` block
- `blocks/*.html` – one file per CMS block (filename = block name)
- `layout/Layout.html` – updated Layout template (keeps tracking + placeholders)
- `pages/home-content.html` – PAGE_CONTENT field for the homepage
- `assets/logo/` – logo SVG (light/dark), icon, favicon SVG/PNG/ICO
- `pages/*-content.html` – PAGE_CONTENT for homepage + ALL interior pages + blog
- `blocks/` – shared blocks (interior hero, breadcrumbs, sidebar, blog, legal, CTA)
- `preview/` – static preview by template type + screenshots 1440/390
- LBS package prices (Bronze/Gold/Platinum/Diamond) are **unchanged** from live

## Mapping: file → where to paste in eFiling

| File | Where in CMS |
|---|---|
| `layout/Layout.html` | Theme / Templates → **Layout** (Overwrite) |
| `css/cf-site-block.html` **or** upload `cf-site.css` | Blocks → **CSS** (`##CSS#`) |
| `blocks/HEADER.html` | Blocks → **HEADER** |
| `blocks/HEADER_TOP.html` | Blocks → **HEADER_TOP** |
| `blocks/HEADER_NAV.html` | Blocks → **HEADER_NAV** |
| `blocks/HERO_Homepage.html` | Blocks → **HERO_Homepage** |
| `blocks/Services.html` | Blocks → **Services** |
| `blocks/HOME_PACKAGES_DESKTOP.html` | Blocks → **HOME_PACKAGES_DESKTOP** |
| `blocks/HOME_PACKAGES_MOBILE.html` | Blocks → **HOME_PACKAGES_MOBILE** |
| `blocks/HELP_SECTION.html` | Blocks → **HELP_SECTION** |
| `blocks/YOUTUBE_SECTION.html` | Blocks → **YOUTUBE_SECTION** |
| `blocks/HOW_IT_WORKS.html` | Blocks → create **HOW_IT_WORKS** (new) |
| `blocks/BANKING_PARTNERS.html` | Blocks → create **BANKING_PARTNERS** (new) |
| `blocks/POPULAR_SERVICES.html` | Blocks → create **POPULAR_SERVICES** (new) |
| `blocks/WHY_US.html` | Blocks → create **WHY_US** (new) |
| `blocks/FAQ_HOME.html` | Blocks → create **FAQ_HOME** (new) |
| `blocks/TRUST_BAR.html` | optional (homepage already uses Services) |
| `blocks/CTA_BAND.html` | optional alias; live CTA is in FOOTER_Register |
| `blocks/FOOTER_Register.html` | Blocks → **FOOTER_Register** |
| `blocks/FOOTER.html` | Blocks → **FOOTER** |
| `blocks/JAVASCRIPT.html` | Blocks → **JAVASCRIPT** |
| `pages/home-content.html` | Pages → Homepage → **Page Content** field |
| `assets/logo/*` | Asset Manager → `/assets/custom/images/` (see below) |

### Homepage – page fields (kept from live)

- **PAGE_TITLE:** The Best UK Company Formation Agent | 121 Company Formation
- **PAGE_DESCRIPTION:** Start your business effortlessly with 121 Company Formation...
- **CUSTOM1:** Online UK Company Formation
- **CUSTOM5:** `##HERO_Homepage#`  ← **the only place** the hero goes (Layout renders it before PAGE_CONTENT)
- Template: Layout / Layout Authenticated
- Checked: Load jQuery, eFiling Core CSS, eFiling Core JS

### Important: hero only once

Layout: `##HEADER#` → `##CUSTOM5#` → `##PAGE_CONTENT#` → …

- Hero = only via **CUSTOM5 = HERO_Homepage**
- `pages/home-content.html` (PAGE_CONTENT) **does not** contain the hero
- Do not paste `##HERO_Homepage#` into PAGE_CONTENT (not even in HTML comments the CMS might resolve) — otherwise the hero appears twice

### PAGE_CONTENT order (homepage)

```
##Services#
##HOME_PACKAGES_DESKTOP#
##HOME_PACKAGES_MOBILE#
##HELP_SECTION#
##YOUTUBE_SECTION#
##HOW_IT_WORKS#
##BANKING_PARTNERS#
##POPULAR_SERVICES#
##WHY_US#
##FAQ_HOME#
```

The old inline “four simple steps” / popular services / why us section in PAGE_CONTENT is **removed** (replaced by the new blocks).  
YouTube: facade with thumbnail + play; iframe loads on click (faster, looks good in screenshots).

## Recommended paste order

1. Upload logo + favicon in Asset Manager (see below).
2. Save a copy / export of the old Layout + blocks (rollback).
3. Paste `layout/Layout.html` into Template Layout.
4. Paste `css/cf-site-block.html` into the CSS block **or** upload `cf-site.css` and put only this in CSS:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link rel="stylesheet" href="/assets/custom/files/cf-site.css?v=1" />
   ```
5. Update HEADER, HEADER_TOP, HEADER_NAV, HERO_Homepage, Services, packages, help, youtube, footer, javascript.
6. Create the new blocks (HOW_IT_WORKS, BANKING_PARTNERS, POPULAR_SERVICES, WHY_US, FAQ_HOME).
7. Replace homepage PAGE_CONTENT with `pages/home-content.html`.
8. Hard refresh + test on desktop and mobile: menu, dropdown, name check, Buy now.

## Logo – Asset Manager upload

In the blocks, the logo points to:

- `/assets/custom/images/logo-wordmark-dark.svg`
- `/assets/custom/images/favicon.ico` (Layout already has the path; bump `?v=` after upload)

Upload from `assets/logo/`:

- `logo-wordmark-dark.svg` (header/footer on dark backgrounds)
- `logo-wordmark-light.svg` (on light backgrounds, if needed)
- `logo-icon.svg`
- `favicon.ico` + optional `favicon.svg` / PNGs

If Asset Manager uses a different path, replace the paths in HEADER_NAV, FOOTER, and Layout.

## Layout placeholders (kept)

`##PAGE_TITLE#` `##PAGE_DESCRIPTION#` `##PAGE_KEYWORDS#` `##COPY_YEAR#`  
`##CUSTOM1#` … `##CUSTOM5#`  
`##BING_GLOBAL_TAG#` `##Google_TM_Global#` `##GOOGLE_ANALYTICS#` `##FB_PIXEL#`  
`##PRELOADER#` `##CSS#` `##HEADER#` `##PAGE_CONTENT#`  
`##FOOTER_Register#` `##FOOTER#` `##JAVASCRIPT#` `##FRESHCHAT#` `##COOKIES#`

We only removed dead IE scripts (html5shiv/respond). We added font preconnect, theme-color, and a modern viewport.

## What we kept vs what we updated

**Kept (live content / data):**

- LBS prices: Bronze £110.95, Gold £192.99, Platinum £242.99, Diamond £506.99
- Package inclusions (24h*, officers, shares, certificates, portal, bank referral, CS, VAT, accounts/CT, VAT returns optional)
- `packagesBuyNow('lbs-…')` for Buy now (platform-compatible)
- Read more links `/lbs-bronze/` etc.
- Contact: email, phone, WhatsApp, Regent Street address
- Claims already on site: 50,000+ formations, Companies House approved, no hidden fees
- Existing YouTube embeds
- Banking partner logos (live URLs)
- FAQ (subset from /frequently-asked-questions/)
- Homepage meta title/description

**Updated (structure, copy, UI):**

- Design system based on the new logo (navy + orange/red gradient, Montserrat/Inter)
- Sticky header + top bar + accessible mobile menu
- Hero built around the promise + name check + proof card
- Trust / how it works / why us / popular services / FAQ accordion / CTA cards
- Reorganised footer
- Namespaced CSS `.cf-*` so it does not fight aggressively with eFiling Core CSS

**Intentionally unchanged:**

- Prices and package structure (internal rewrite to follow later)
- Order forms generated by the platform
- Native eFiling forms (name-check, login, register) – stay on the platform; CSS styles them partially via legacy hooks

## Risks / technical notes

1. **Core CSS conflict:** eFiling Core CSS + the old theme (`saas_`, `f_p`, `header_area` classes) remain active. The new UI uses only `.cf-*`. If you see old styles on unreplaced elements, delete the old markup from PAGE_CONTENT.
2. **Google Fonts:** need network access; for zero third-party, upload fonts locally and change the `@import` in CSS.
3. **Buy now:** depends on the platform JS `packagesBuyNow`. In the static preview it is a stub.
4. **Credit / SEO:** the redesign is visual; on-page SEO meta stay on placeholders. We do not invent reviews/awards.
5. **£55.95** appeared in the old live Services text, but LBS packages start at £110.95 – in Services we aligned the copy to £110.95 so it does not contradict the packages.

## Rollback

1. Restore Template Layout from backup / previous version.
2. Restore HEADER*, Services, packages, HELP, YOUTUBE, FOOTER*, JAVASCRIPT, CSS blocks.
3. Restore homepage PAGE_CONTENT.
4. Delete the new blocks if you no longer use them.
5. Hard refresh / CDN cache if any.

Ideal: before overwrite, copy each old block into a local `backup-old/NAME.html` file.

## Local preview

Open `preview/index.html` (or serve the redesign folder).

```bash
# from the project root
npm install
npm start
# then open http://localhost:3000
# Interior routes mirror live URLs, e.g. /about-us/ /packages/ /lbs-bronze/
```

Screenshots: `preview/screenshots/*-desktop-full.png` and `*-mobile-full.png` (1440 / 390).

## Live content we could not fully extract

- Detailed descriptions under each “four steps” step on the homepage were mostly on images; we wrote short text based on the live titles.
- The LLP / LBG / International comparison on the homepage is not rebuilt card-by-card (there is still a “View LLP, LBG & International packages” link to `/packages/`). LLP/LBG prices found on live: Bronze £135.95, Gold £212.99, Platinum £262.99, Diamond £526.99 – we **did not** put them on the homepage so we do not anticipate the package rewrite.


## Full-site extension (all pages + blog)

Crawl: `sitemap.xml` + nav + footer (November 2026). The sitemap is partly stale (e.g. `/lbs-silver/` and `/blog/` return 404 on live).

### New shared blocks (paste into Blocks)

| File | CMS block | Role |
|---|---|---|
| `blocks/PAGE_HERO_INNER.html` | **PAGE_HERO_INNER** | Interior hero (CUSTOM2=crumb, CUSTOM3=title, CUSTOM4=lead) |
| `blocks/BREADCRUMBS.html` | **BREADCRUMBS** | optional breadcrumbs only |
| `blocks/SERVICE_SIDEBAR.html` | **SERVICE_SIDEBAR** | CTA + packages on service/guide/package pages |
| `blocks/CTA_BAND.html` | **CTA_BAND** | reusable CTA band |
| `blocks/BLOG_LIST.html` | **BLOG_LIST** | blog list wrapper (platform classes) |
| `blocks/BLOG_CARD.html` | **BLOG_CARD** | post card (static fallback) |
| `blocks/BLOG_POST_LAYOUT.html` | **BLOG_POST_LAYOUT** | article layout + sidebar |
| `blocks/BLOG_SIDEBAR.html` | **BLOG_SIDEBAR** | search / guides / CTA |
| `blocks/LEGAL_LAYOUT.html` | **LEGAL_LAYOUT** | legal pages wrapper |

Typical page (service / guide / package detail):

1. CUSTOM5 (optional) = `##PAGE_HERO_INNER#` **or** hero already included in PAGE_CONTENT (files in `pages/` include the hero inline so they are self-contained).
2. PAGE_CONTENT = content from `pages/<slug>-content.html`
3. Checked: Core CSS + Core JS + jQuery (same as homepage)
4. `body` must have the `cf-redesign` class (Layout puts it on `body_wrapper` / body – check Layout.html)

### URL → PAGE_CONTENT file mapping

| URL | Template | PAGE_CONTENT | Key blocks | CUSTOM (suggestion) | Status |
|---|---|---|---|---|---|
| `/` | home | `pages/home-content.html` | HERO_Homepage, Services, packages, … | CUSTOM5=`##HERO_Homepage#` | done |
| `/packages/` | packages-listing | `pages/packages-content.html` | PAGE_HERO_INNER, packages cards | CUSTOM1=Packages | done |
| `/lbs-bronze/` | package-detail | `pages/lbs-bronze-content.html` | PAGE_HERO, SERVICE_SIDEBAR | CUSTOM1=Bronze | done |
| `/lbs-gold/` | package-detail | `pages/lbs-gold-content.html` | idem | CUSTOM1=Gold | done |
| `/lbs-platinum/` | package-detail | `pages/lbs-platinum-content.html` | idem | CUSTOM1=Platinum | done |
| `/lbs-diamond/` | package-detail | `pages/lbs-diamond-content.html` | idem | CUSTOM1=Diamond | done |
| `/lbs-silver/` | package-detail | — | — | — | **no** (live 404; removed from nav) |
| `/registered-office-address/` | service | `pages/registered-office-address-content.html` | PAGE_HERO, SERVICE_SIDEBAR, prose | — | done |
| `/service-address/` | service | `pages/service-address-content.html` | idem | — | done |
| `/trade-mail-forwarding/` | service | `pages/trade-mail-forwarding-content.html` | idem | — | done |
| `/renewals/` | service | `pages/renewals-content.html` | idem | — | done |
| `/confirmation-statement-service/` | service | `pages/confirmation-statement-service-content.html` | idem | — | done |
| `/company-closure/` | service | `pages/company-closure-content.html` | idem | — | done |
| `/company-name-change/` | service | `pages/company-name-change-content.html` | idem | — | done |
| `/vat-registration/` | service | `pages/vat-registration-content.html` | idem | — | done |
| `/vat/` | service | — | — | — | **no** (found in search, not in sitemap; 404/redirect unconfirmed) |
| `/director-appointment-and-resignation/` | service | `pages/director-appointment-and-resignation-content.html` | idem | — | done |
| `/business-telephone-service/` | service | `pages/business-telephone-service-content.html` | idem | — | done |
| `/transfer-of-shares/` | service | `pages/transfer-of-shares-content.html` | idem | — | done |
| `/allocation-of-shares/` | service | `pages/allocation-of-shares-content.html` | idem | — | done |
| `/certificate-of-good-standing/` | service | `pages/certificate-of-good-standing-content.html` | idem | — | done |
| `/business-banking/` | service | `pages/business-banking-content.html` | idem | — | done |
| `/year-end-accounts/` | service | `pages/year-end-accounts-content.html` | idem | — | done |
| `/corporation-tax/` | service | `pages/corporation-tax-content.html` | idem | — | done |
| `/bookkeeping/` | service | `pages/bookkeeping-content.html` | idem | — | done |
| `/vat-returns/` | service | `pages/vat-returns-content.html` | idem | — | done |
| `/payroll-and-paye/` | service | `pages/payroll-and-paye-content.html` | idem | — | done |
| `/dormant-company-account/` | service | `pages/dormant-company-account-content.html` | idem | — | done |
| `/director-salary-and-dividends/` | service | `pages/director-salary-and-dividends-content.html` | idem | — | done |
| `/introduction-to-company-formation/` | guide | `pages/introduction-to-company-formation-content.html` | PAGE_HERO, prose, sidebar | — | done |
| `/company-formation-checklist/` | guide | `pages/company-formation-checklist-content.html` | idem | — | done |
| `/our-4-step-guide-to-setting-up-a-company/` | guide | `pages/our-4-step-guide-to-setting-up-a-company-content.html` | idem | — | done |
| `/post-incorporation-activities/` | guide | `pages/post-incorporation-activities-content.html` | idem | — | done |
| `/admin-portal-to-manage-your-companies/` | guide | `pages/admin-portal-to-manage-your-companies-content.html` | idem | — | done |
| `/online-company-name-search-tool/` | guide | `pages/online-company-name-search-tool-content.html` | idem | — | done |
| `/company-director/` | guide | `pages/company-director-content.html` | idem | — | done |
| `/company-secretary/` | guide | `pages/company-secretary-content.html` | idem | — | done |
| `/limited-company-shareholders/` | guide | `pages/limited-company-shareholders-content.html` | idem | — | done |
| `/limited-by-shares/` | guide | `pages/limited-by-shares-content.html` | idem | — | done |
| `/limited-by-guarantee-company/` | guide | `pages/limited-by-guarantee-company-content.html` | idem | — | done |
| `/limited-liability-partnership/` | guide | `pages/limited-liability-partnership-content.html` | idem | — | done |
| `/about-us/` | about | `pages/about-us-content.html` | PAGE_HERO, prose | — | done |
| `/contact-us/` | contact | `pages/contact-us-content.html` | PAGE_HERO, contact cards | — | done |
| `/frequently-asked-questions/` | faq | `pages/frequently-asked-questions-content.html` | PAGE_HERO, accordion | — | done |
| `/privacy-policy/` | legal | `pages/privacy-policy-content.html` | PAGE_HERO, LEGAL_LAYOUT/prose | — | done |
| `/terms-and-conditions/` | legal | `pages/terms-and-conditions-content.html` | idem | — | done |
| `/terms/` | legal | `pages/terms-content.html` | idem (alias) | — | done |
| `/refund-and-cancellation-policy/` | legal | `pages/refund-and-cancellation-policy-content.html` | idem | — | done |
| `/blog/` | blog-index | `pages/blog-content.html` | PAGE_HERO, BLOG_LIST, BLOG_SIDEBAR | — | done (fallback content; live 404) |
| `/blog/{post}/` | blog-post | `pages/blog-post-sample-content.html` + platform CSS | BLOG_POST_LAYOUT, BLOG_SIDEBAR | — | template ready |
| 404 | error | `pages/404-content.html` | PAGE_HERO | — | done |
| `/name-check/*` | platform | — | CSS legacy hook | — | **no** (native eFiling flow) |
| `/login/`, `/register/` | platform-auth | — | partial CSS hook | — | **no** (native eFiling flow) |

Near-identical service pages: one layout (hero + prose + `##SERVICE_SIDEBAR#`) + one content file per existing URL.

### Blog – how it is set up

1. **Live `/blog/` = 404** at crawl time (stale sitemap). Content in `pages/blog-content.html` is ready to paste when the module is reactivated.
2. **CSS styles platform markup** (classes seen in the theme / old feeds):  
   `.blog_area`, `.blog_list_item`, `.blog_list_item_two`, `.blog_grid_item`, `.blog_post_item`, `.blog_item`, `.blog_img`, `.blog_content`, `.blog_title`, `.blog_titles`, `.post_date`, `.post_time`, `.blog_single`, `.blog-sidebar`, `.widget`, `.widget_title`, `.pagination`.
3. Optional wrappers: `BLOG_LIST`, `BLOG_CARD`, `BLOG_POST_LAYOUT`, `BLOG_SIDEBAR` – use them if you paste static guides or if the platform allows HTML around the loop.
4. Long-form typography: `.cf-prose` (h2–h4, lists, tables, blockquote, images, code/pre).
5. Article: date/reading time meta (if present in markup), related (list), share links, CTA in article footer.
6. Interim: the blog index links existing guides (`/introduction-to-company-formation/` etc.) as “cards” until the dynamic feed returns.
7. `wp-json` on the domain returned 502 at crawl – we do not rely on the WordPress API.

### Preview templates + screenshots

Preview HTML (one per type):

- `preview/index.html`, `packages.html`, `package-bronze.html`, `service-registered-office.html`, `guide-introduction.html`, `about.html`, `contact.html`, `faq.html`, `legal-privacy.html`, `blog.html`, `blog-post.html`, `error-404.html`

Full-page screenshots (desktop 1440 + mobile 390) in `preview/screenshots/`:

- `*-desktop-full.png`, `*-mobile-full.png` for each preview above
- QA segments: `preview/screenshots/segments/`

### Interior pages paste order

1. Ensure Layout + CSS + HEADER/FOOTER are already on the new design (same as homepage).
2. Create the new blocks from the table above.
3. For each URL: open the page in CMS → replace PAGE_CONTENT with the file from `pages/`.
4. Package detail: keep the `packagesBuyNow('lbs-…')` buttons from the content.
5. Legal pages: verify legal text against the internally approved version (we kept the substance from the crawl; we do not invent clauses).
6. Blog: enable the `/blog/` route in the platform, then paste `blog-content.html`; dynamic posts should look correct with CSS alone.
