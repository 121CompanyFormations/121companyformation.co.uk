# 121 Company Formation – redesign pentru eFiling Web Builder

Ghid de instalare (limba romana, fara diacritice).  
Build production-oriented: un singur CSS + HTML impartit pe blocuri `##NAME#`.

## Ce primesti

- `css/cf-site.css` – tot stilul, namespaced cu prefix `cf-`
- `css/cf-site-block.html` – acelasi CSS, gata de lipit in blocul `##CSS#`
- `blocks/*.html` – cate un fisier per bloc CMS (nume = numele blocului)
- `layout/Layout.html` – template Layout actualizat (pastreaza tracking + placeholders)
- `pages/home-content.html` – continutul campului PAGE_CONTENT pentru homepage
- `assets/logo/` – logo SVG (light/dark), icon, favicon SVG/PNG/ICO
- `pages/*-content.html` – PAGE_CONTENT pentru homepage + TOATE paginile interioare + blog
- `blocks/` – blocuri partajate (hero interior, breadcrumbs, sidebar, blog, legal, CTA)
- `preview/` – preview static pe tipuri de template + screenshots 1440/390
- Preturile si pachetele LBS (Bronze/Gold/Platinum/Diamond) sunt **neschimbate** fata de live

## Mapare: fisier → unde lipesti in eFiling

| Fisier | Unde in CMS |
|---|---|
| `layout/Layout.html` | Theme / Templates → **Layout** (Overwrite) |
| `css/cf-site-block.html` **sau** upload `cf-site.css` | Blocks → **CSS** (`##CSS#`) |
| `blocks/HEADER.html` | Blocks → **HEADER** |
| `blocks/HEADER_TOP.html` | Blocks → **HEADER_TOP** |
| `blocks/HEADER_NAV.html` | Blocks → **HEADER_NAV** |
| `blocks/HERO_Homepage.html` | Blocks → **HERO_Homepage** |
| `blocks/Services.html` | Blocks → **Services** |
| `blocks/HOME_PACKAGES_DESKTOP.html` | Blocks → **HOME_PACKAGES_DESKTOP** |
| `blocks/HOME_PACKAGES_MOBILE.html` | Blocks → **HOME_PACKAGES_MOBILE** |
| `blocks/HELP_SECTION.html` | Blocks → **HELP_SECTION** |
| `blocks/YOUTUBE_SECTION.html` | Blocks → **YOUTUBE_SECTION** |
| `blocks/HOW_IT_WORKS.html` | Blocks → creeaza **HOW_IT_WORKS** (nou) |
| `blocks/BANKING_PARTNERS.html` | Blocks → creeaza **BANKING_PARTNERS** (nou) |
| `blocks/POPULAR_SERVICES.html` | Blocks → creeaza **POPULAR_SERVICES** (nou) |
| `blocks/WHY_US.html` | Blocks → creeaza **WHY_US** (nou) |
| `blocks/FAQ_HOME.html` | Blocks → creeaza **FAQ_HOME** (nou) |
| `blocks/TRUST_BAR.html` | optional (homepage foloseste deja Services) |
| `blocks/CTA_BAND.html` | optional alias; CTA-ul live e in FOOTER_Register |
| `blocks/FOOTER_Register.html` | Blocks → **FOOTER_Register** |
| `blocks/FOOTER.html` | Blocks → **FOOTER** |
| `blocks/JAVASCRIPT.html` | Blocks → **JAVASCRIPT** |
| `pages/home-content.html` | Pages → Homepage → camp **Page Content** |
| `assets/logo/*` | Asset Manager → `/assets/custom/images/` (vezi mai jos) |

### Homepage – campuri pagina (pastrate din live)

- **PAGE_TITLE:** The Best UK Company Formation Agent | 121 Company Formation
- **PAGE_DESCRIPTION:** Start your business effortlessly with 121 Company Formation...
- **CUSTOM1:** Online UK Company Formation
- **CUSTOM5:** `##HERO_Homepage#`  ← **singurul loc** unde intra hero-ul (Layout il randeaza inainte de PAGE_CONTENT)
- Template: Layout / Layout Authenticated
- Bifate: Load jQuery, eFiling Core CSS, eFiling Core JS

### Important: hero o singura data

Layout: `##HEADER#` → `##CUSTOM5#` → `##PAGE_CONTENT#` → …

- Hero = doar prin **CUSTOM5 = HERO_Homepage**
- `pages/home-content.html` (PAGE_CONTENT) **nu** contine hero-ul
- Nu lipi `##HERO_Homepage#` in PAGE_CONTENT (nici in comentarii HTML pe care CMS le-ar putea resolve) — altfel hero-ul apare de doua ori

### Ordinea PAGE_CONTENT (homepage)

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

Sectiunea veche inline „four simple steps” / popular services / why us din PAGE_CONTENT se **sterge** (e inlocuita de blocurile noi).
YouTube: facade cu thumbnail + play; iframe se incarca la click (mai rapid, arata bine in screenshot).

## Ordine recomandata de paste

1. Upload logo + favicon in Asset Manager (vezi mai jos).
2. Salveaza o copie / export al Layout + blocurilor vechi (rollback).
3. Lipeste `layout/Layout.html` in Template Layout.
4. Lipeste `css/cf-site-block.html` in blocul CSS **sau** uploadeaza `cf-site.css` si in CSS pune doar:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link rel="stylesheet" href="/assets/custom/files/cf-site.css?v=1" />
   ```
5. Actualizeaza HEADER, HEADER_TOP, HEADER_NAV, HERO_Homepage, Services, packages, help, youtube, footer, javascript.
6. Creeaza blocurile noi (HOW_IT_WORKS, BANKING_PARTNERS, POPULAR_SERVICES, WHY_US, FAQ_HOME).
7. Inlocuieste PAGE_CONTENT homepage cu `pages/home-content.html`.
8. Hard refresh + test pe desktop si mobil: meniu, dropdown, name check, Buy now.

## Logo – upload Asset Manager

Inblocuri, logo-ul pointeaza la:

- `/assets/custom/images/logo-wordmark-dark.svg`
- `/assets/custom/images/favicon.ico` (Layout deja are path-ul; creste `?v=` dupa upload)

Uploadeaza din `assets/logo/`:

- `logo-wordmark-dark.svg` (header/footer pe fundal inchis)
- `logo-wordmark-light.svg` (pe fundal deschis, daca ai nevoie)
- `logo-icon.svg`
- `favicon.ico` + optional `favicon.svg` / PNG-uri

Daca Asset Manager foloseste alt path, inlocuieste path-urile in HEADER_NAV, FOOTER si Layout.

## Placeholders Layout (pastrate)

`##PAGE_TITLE#` `##PAGE_DESCRIPTION#` `##PAGE_KEYWORDS#` `##COPY_YEAR#`  
`##CUSTOM1#` … `##CUSTOM5#`  
`##BING_GLOBAL_TAG#` `##Google_TM_Global#` `##GOOGLE_ANALYTICS#` `##FB_PIXEL#`  
`##PRELOADER#` `##CSS#` `##HEADER#` `##PAGE_CONTENT#`  
`##FOOTER_Register#` `##FOOTER#` `##JAVASCRIPT#` `##FRESHCHAT#` `##COOKIES#`

Am scos doar scripturile moarte IE (html5shiv/respond). Am adaugat preconnect fonturi, theme-color, viewport modern.

## Ce am pastrat vs ce am actualizat

**Pastrat (continut / date live):**

- Preturi LBS: Bronze £110.95, Gold £192.99, Platinum £242.99, Diamond £506.99
- Incluziuni pachete (24h*, officers, shares, certificates, portal, bank referral, CS, VAT, accounts/CT, VAT returns optional)
- `packagesBuyNow('lbs-…')` pentru Buy now (compatibil platforma)
- Linkuri Read more `/lbs-bronze/` etc.
- Contact: email, telefon, WhatsApp, adresa Regent Street
- Claim-uri deja pe site: 50,000+ formations, Companies House approved, no hidden fees
- Embed-uri YouTube existente
- Logo partners banking (URL-uri live)
- FAQ (subset din /frequently-asked-questions/)
- Meta title/description homepage

**Actualizat (structura, copy, UI):**

- Design system pe logo nou (navy + gradient orange/red, Montserrat/Inter)
- Header sticky + top bar + meniu mobil accesibil
- Hero pe promise + name check + proof card
- Cards trust / how it works / why us / popular services / FAQ accordion / CTA
- Footer reorganizat
- CSS namespaced `.cf-*` ca sa nu lupte agresiv cu eFiling Core CSS

**Neschimbat intentionat:**

- Preturi si structura pachetelor (urmeaza refacere interna ulterior)
- Formularele de order generate de platforma
- Formularele native eFiling (name-check, login, register) – raman pe platforma; CSS le stilizeaza partial prin hook-uri legacy

## Riscuri / note tehnice

1. **Conflict CSS core:** eFiling Core CSS + tema veche (clase `saas_`, `f_p`, `header_area`) raman active. Noul UI foloseste doar `.cf-*`. Daca vezi stiluri vechi pe elemente neinlocuite, sterge markup-ul vechi din PAGE_CONTENT.
2. **Fonturi Google:** necesita acces retea; daca vrei zero third-party, uploadeaza fonturile local si schimba `@import` din CSS.
3. **Buy now:** depinde de JS-ul platformei `packagesBuyNow`. In preview static e un stub.
4. **Credit / SEO:** redesignul e vizual; SEO on-page meta raman pe placeholders. Nu inventam review-uri/award-uri.
5. **£55.95** aparea in vechiul text Services pe live, dar pachetele LBS pornesc de la £110.95 – in Services am aliniat copy-ul la £110.95 ca sa nu contrazica pachetele.

## Rollback

1. Restaureaza Template Layout din backup / versiunea anterioara.
2. Restaureaza blocurile HEADER*, Services, packages, HELP, YOUTUBE, FOOTER*, JAVASCRIPT, CSS.
3. Restaureaza PAGE_CONTENT homepage.
4. Sterge blocurile noi daca nu le mai folosesti.
5. Hard refresh / cache CDN daca exista.

Ideal: inainte de overwrite, copiaza fiecare bloc vechi intr-un fisier local `backup-old/NOME.html`.

## Preview local

Deschide `preview/index.html` (sau serveste folderul redesign).  
Screenshots: `preview/screenshots/*-desktop-full.png` si `*-mobile-full.png` (1440 / 390).

## Continut live pe care nu l-am putut extrage complet

- Descrierile detaliate de sub fiecare pas din „four steps” pe homepage erau in mare parte pe imagini; am scris scurte texte pe baza titlurilor live.
- Comparatia LLP / LBG / International pe homepage nu e refacuta card-cu-card (ramane link „View LLP, LBG & International packages” catre `/packages/`). Preturile LLP/LBG gasite pe live: Bronze £135.95, Gold £212.99, Platinum £262.99, Diamond £526.99 – **nu** le-am pus pe homepage ca sa nu anticipam refacerea de pachete.


## Extindere full-site (toate paginile + blog)

Crawl: `sitemap.xml` + nav + footer (noiembrie 2026). Sitemap-ul e partial stale (ex. `/lbs-silver/` si `/blog/` dau 404 pe live).

### Blocuri noi partajate (lipeste in Blocks)

| Fisier | Bloc CMS | Rol |
|---|---|---|
| `blocks/PAGE_HERO_INNER.html` | **PAGE_HERO_INNER** | Hero interior (CUSTOM2=crumb, CUSTOM3=title, CUSTOM4=lead) |
| `blocks/BREADCRUMBS.html` | **BREADCRUMBS** | optional breadcrumbs solo |
| `blocks/SERVICE_SIDEBAR.html` | **SERVICE_SIDEBAR** | CTA + pachete pe pagini service/guide/package |
| `blocks/CTA_BAND.html` | **CTA_BAND** | banda CTA reutilizabila |
| `blocks/BLOG_LIST.html` | **BLOG_LIST** | wrapper lista blog (clase platforma) |
| `blocks/BLOG_CARD.html` | **BLOG_CARD** | card post (fallback static) |
| `blocks/BLOG_POST_LAYOUT.html` | **BLOG_POST_LAYOUT** | layout articol + sidebar |
| `blocks/BLOG_SIDEBAR.html` | **BLOG_SIDEBAR** | search / guides / CTA |
| `blocks/LEGAL_LAYOUT.html` | **LEGAL_LAYOUT** | wrapper pagini legale |

Pagina tipica (service / guide / package detail):

1. CUSTOM5 (optional) = `##PAGE_HERO_INNER#` **sau** hero inclus deja in PAGE_CONTENT (fisierele din `pages/` includ hero-ul inline ca sa fie self-contained).
2. PAGE_CONTENT = continutul din `pages/<slug>-content.html`
3. Bifate: Core CSS + Core JS + jQuery (ca pe homepage)
4. `body` trebuie sa aiba clasa `cf-redesign` (Layout o pune pe `body_wrapper` / body – verifica Layout.html)

### Tabel mapare URL → fisier PAGE_CONTENT

| URL | Template | PAGE_CONTENT | Blocuri cheie | CUSTOM (sugestie) | Status |
|---|---|---|---|---|---|
| `/` | home | `pages/home-content.html` | HERO_Homepage, Services, packages, … | CUSTOM5=`##HERO_Homepage#` | done |
| `/packages/` | packages-listing | `pages/packages-content.html` | PAGE_HERO_INNER, packages cards | CUSTOM1=Packages | done |
| `/lbs-bronze/` | package-detail | `pages/lbs-bronze-content.html` | PAGE_HERO, SERVICE_SIDEBAR | CUSTOM1=Bronze | done |
| `/lbs-gold/` | package-detail | `pages/lbs-gold-content.html` | idem | CUSTOM1=Gold | done |
| `/lbs-platinum/` | package-detail | `pages/lbs-platinum-content.html` | idem | CUSTOM1=Platinum | done |
| `/lbs-diamond/` | package-detail | `pages/lbs-diamond-content.html` | idem | CUSTOM1=Diamond | done |
| `/lbs-silver/` | package-detail | — | — | — | **nu** (live 404; scos din nav) |
| `/registered-office-address/` | service | `pages/registered-office-address-content.html` | PAGE_HERO, SERVICE_SIDEBAR, prose | — | done |
| `/service-address/` | service | `pages/service-address-content.html` | idem | — | done |
| `/trade-mail-forwarding/` | service | `pages/trade-mail-forwarding-content.html` | idem | — | done |
| `/renewals/` | service | `pages/renewals-content.html` | idem | — | done |
| `/confirmation-statement-service/` | service | `pages/confirmation-statement-service-content.html` | idem | — | done |
| `/company-closure/` | service | `pages/company-closure-content.html` | idem | — | done |
| `/company-name-change/` | service | `pages/company-name-change-content.html` | idem | — | done |
| `/vat-registration/` | service | `pages/vat-registration-content.html` | idem | — | done |
| `/vat/` | service | — | — | — | **nu** (gasit in search, nu in sitemap; 404/redirect neconfirmat) |
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
| `/blog/` | blog-index | `pages/blog-content.html` | PAGE_HERO, BLOG_LIST, BLOG_SIDEBAR | — | done (continut fallback; live 404) |
| `/blog/{post}/` | blog-post | `pages/blog-post-sample-content.html` + CSS platforma | BLOG_POST_LAYOUT, BLOG_SIDEBAR | — | template ready |
| 404 | error | `pages/404-content.html` | PAGE_HERO | — | done |
| `/name-check/*` | platform | — | CSS hook legacy | — | **nu** (flow nativ eFiling) |
| `/login/`, `/register/` | platform-auth | — | CSS hook partial | — | **nu** (flow nativ eFiling) |

Service pages near-identical: un singur layout (hero + prose + `##SERVICE_SIDEBAR#`) + fisier content per URL existent.

### Blog – cum e setat

1. **Live `/blog/` = 404** la crawl (sitemap stale). Continutul din `pages/blog-content.html` e gata de lipit cand modulul e reactivat.
2. **CSS stilizeaza markup-ul platformei** (clase vazute in tema / feed-uri vechi):  
   `.blog_area`, `.blog_list_item`, `.blog_list_item_two`, `.blog_grid_item`, `.blog_post_item`, `.blog_item`, `.blog_img`, `.blog_content`, `.blog_title`, `.blog_titles`, `.post_date`, `.post_time`, `.blog_single`, `.blog-sidebar`, `.widget`, `.widget_title`, `.pagination`.
3. Wrapper-e optionale: `BLOG_LIST`, `BLOG_CARD`, `BLOG_POST_LAYOUT`, `BLOG_SIDEBAR` – foloseste-le daca lipesti ghiduri static sau daca platforma permite HTML in jurul loop-ului.
4. Tipografie long-form: `.cf-prose` (h2–h4, liste, tabele, blockquote, imagini, code/pre).
5. Articol: meta data/reading time (daca exista in markup), related (lista), share links, CTA in footer articol.
6. Interim: indexul blog leaga ghidurile existente (`/introduction-to-company-formation/` etc.) ca „cards” pana reapare feed-ul dinamic.
7. `wp-json` pe domeniu a raspuns 502 la crawl – nu ne bazam pe API WordPress.

### Preview templates + screenshots

Preview HTML (unul per tip):

- `preview/index.html`, `packages.html`, `package-bronze.html`, `service-registered-office.html`, `guide-introduction.html`, `about.html`, `contact.html`, `faq.html`, `legal-privacy.html`, `blog.html`, `blog-post.html`, `error-404.html`

Screenshots full-page (desktop 1440 + mobile 390) in `preview/screenshots/`:

- `*-desktop-full.png`, `*-mobile-full.png` pentru fiecare preview de mai sus
- Segmente QA: `preview/screenshots/segments/`

### Ordine paste pagini interioare

1. Asigura Layout + CSS + HEADER/FOOTER deja pe noul design (ca homepage).
2. Creeaza blocurile noi din tabelul de mai sus.
3. Pentru fiecare URL: deschide pagina in CMS → inlocuieste PAGE_CONTENT cu fisierul din `pages/`.
4. Package detail: pastreaza butoanele `packagesBuyNow('lbs-…')` din content.
5. Pagini legale: verifica textul legal cu versiunea aprobata intern (am pastrat substanta din crawl; nu inventam clauze).
6. Blog: activeaza ruta `/blog/` in platforma, apoi lipeste `blog-content.html`; posturile dinamice ar trebui sa arate corect doar cu CSS.

