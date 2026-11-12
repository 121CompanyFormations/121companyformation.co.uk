/**
 * Build prod-effiling/ – the redesign laid out exactly like the live eFiling export
 * (../prod-backup/prod-backup: blocks/*.html + pages/**.yml).
 *
 *   node scripts/build-prod-effiling.mjs            (or: npm run build:prod)
 *   PROD_BACKUP=<path to prod-backup/prod-backup> node scripts/build-prod-effiling.mjs
 *
 * Single blocks source: prod-effiling/blocks (edit redesign blocks there).
 * This script snapshots blocks/, regenerates pages/assets/restyled blocks, then
 * writes redesign + preview helper blocks back from the snapshot.
 *
 * Output:
 *   blocks/*.html            every live block, redesigned / restyled / copied (see README.md)
 *   pages/**.yml             every live page + /blog/, redesigned body, JSON-LD kept/updated
 *   layout/Layout.html       Layout template (not part of the export)
 *   assets/custom/files/     app_min.css, app_min.js   → Asset Manager
 *   assets/custom/images/    logos + favicon           → Asset Manager
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import * as sass from "sass";
import { ROOT, BACKUP, OUT, read, write, copyFile, walk, rel } from "./prod/lib.mjs";
import * as B from "./prod/blocks.mjs";
import * as P from "./prod/pages.mjs";

const require = createRequire(import.meta.url);
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);

/* -------------------------------------- 1. snapshot blocks, then clean */
const blocksSrc = path.join(OUT, "blocks");
if (!fs.existsSync(blocksSrc)) {
  throw new Error(`Missing ${blocksSrc} – redesign blocks live only in prod-effiling/blocks`);
}
const snap = fs.mkdtempSync(path.join(os.tmpdir(), "cf-prod-blocks-"));
fs.cpSync(blocksSrc, snap, { recursive: true });
B.setProjectBlocksPath(snap);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------ 2. CSS + JS build */
async function buildAssets() {
  const filesDir = path.join(OUT, "assets", "custom", "files");
  fs.mkdirSync(filesDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(OUT, ".tmp-"));

  // JS (same file list as dist/app_min.js)
  const JS_FILES = require(path.join(ROOT, "gulp", "includes", "js.js"));
  const parts = JS_FILES.map((f) => fs.readFileSync(path.join(ROOT, f.replace(/^\.\//, "")), "utf8"));
  fs.writeFileSync(path.join(tmp, "app.js"), parts.join("\n;\n"), "utf8");
  await esbuild.build({ entryPoints: [path.join(tmp, "app.js")], outfile: path.join(filesDir, "app_min.js"), minify: true, bundle: true, target: ["es2018"], format: "iife", legalComments: "none" });

  // CSS = marketing (cf-site.css) + eFiling theme scss (incl. _legacy-prod.scss)
  const theme = sass.compile(path.join(ROOT, "dev", "static", "scss", "styles.scss"), {
    style: "expanded",
    loadPaths: [path.join(ROOT, "dev", "static", "scss")],
    silenceDeprecations: ["import"],
    logger: sass.Logger.silent,
  });
  const marketing = fs.readFileSync(path.join(ROOT, "css", "cf-site.css"), "utf8");
  let combined = `${marketing}\n\n${String(theme.css).replace(/^@charset[^;]+;\s*/i, "")}\n`;
  // preview-only asset path → Asset Manager path used by the live site
  combined = combined.replaceAll("/assets/home/header-contact-v3.jpg", "/assets/custom/images/teaser/header-contact-v3.jpg");
  fs.writeFileSync(path.join(tmp, "app.css"), combined, "utf8");
  await esbuild.build({ entryPoints: [path.join(tmp, "app.css")], outfile: path.join(filesDir, "app_min.css"), minify: true, bundle: false, loader: { ".css": "css" }, legalComments: "none" });
  fs.rmSync(tmp, { recursive: true, force: true });

  const cssVer = hash(fs.readFileSync(path.join(filesDir, "app_min.css")));
  const jsVer = hash(fs.readFileSync(path.join(filesDir, "app_min.js")));
  return { cssVer, jsVer };
}

const { cssVer, jsVer } = await buildAssets();

// logos / favicon (README: Asset Manager → /assets/custom/images/)
for (const f of fs.readdirSync(path.join(ROOT, "assets", "logo"))) {
  copyFile(path.join(ROOT, "assets", "logo", f), path.join(OUT, "assets", "custom", "images", f));
}

/* ------------------------------------------------------------- 3. blocks */
const blocks = new Map();
const backupBlockNames = fs.readdirSync(path.join(BACKUP, "blocks")).map((f) => f.replace(/\.html$/, ""));

for (const name of B.FROM_PROJECT) blocks.set(name, B.projectBlock(name));
for (const name of B.VERBATIM) blocks.set(name, B.backupBlock(name));

blocks.set("FOOTER", B.footer());
blocks.set("HEADER_Authenticated", B.headerAuthenticated());
blocks.set("HEADER_NAV_Authenticated", B.headerNavAuthenticated());
blocks.set("CSS", B.cssBlock(cssVer));
blocks.set("JAVASCRIPT", B.javascriptBlock(jsVer));
blocks.set("HTML_HEAD", B.htmlHead());
blocks.set("PRELOADER", B.preloader());
blocks.set("COOKIES", B.cookies());
blocks.set("INITIAL_CHECKOUT_CSS", B.initialCheckoutCss());
blocks.set("NAME_CHECK_FORM", B.nameCheckForm());
blocks.set("HERO_PAGE", B.heroPage());
blocks.set("HERO_PAGE_Services2", B.heroPageServices2());
blocks.set("HERO_PAGE_Services", B.heroPageServices());
blocks.set("HERO_PAGE_Help", B.heroPageHelp());
blocks.set("BUY_UNAVAILABLE", B.buyUnavailable());
blocks.set("RECENTPOSTS_BLOG", B.recentPostsBlog());
blocks.set("SIDEBAR", B.sidebar());
blocks.set("SIDEBAR_AUTHENTICATED", B.sidebarAuthenticated());
blocks.set("SIDEBAR_NO_LOGIN", B.sidebarNoLogin());
blocks.set("SIDEBAR_BANNERS", B.sidebarBanners());

/* -------------------------------------------------------------- 4. pages */
const pages = new Map();
for (const file of P.allBackupPages()) {
  const { slug, text } = P.buildPage(file);
  pages.set(slug === ".root" ? ".root" : slug, text);
}
for (const { slug, text } of P.buildNewPages()) pages.set(slug, text);

/* ------------------------------------------------------------- 5. layout */
function layout() {
  let l = read(path.join(ROOT, "layout", "Layout.html"));
  l = l.replace('<body class="##CUSTOM1# cf-redesign">', '<body class="##CUSTOM4# cf-redesign">');
  // stylesheet belongs in <head>
  l = l.replace('  <!-- Modern browsers only: IE html5shiv/respond removed -->\n</head>', '  ##CSS#\n</head>').replace(/\n  ##CSS#\n  <div class="body_wrapper">/, '\n  <div class="body_wrapper">');
  return l;
}

/* ------------------------------------------------------------ 6. checks */
const PLATFORM_VARS = new Set([
  "PAGE_TITLE", "PAGE_DESCRIPTION", "PAGE_KEYWORDS", "PAGE_URL", "PAGE_CONTENT", "CUSTOM1", "CUSTOM2", "CUSTOM3", "CUSTOM4", "CUSTOM5",
  "COMPANY_REQUESTED_NAME", "PACKAGE_NAME", "SIDEBAR_TOP", "USER_NAMESTRING", "BRAND_NAME",
]);
const known = new Set([...blocks.keys(), ...PLATFORM_VARS]);
const problems = [];
const check = (where, text) => {
  for (const m of text.matchAll(/##([A-Za-z0-9_\-]+)#/g)) if (!known.has(m[1])) problems.push(`${where}: unresolved ##${m[1]}#`);
  if (/\/assets\/(logo|banking|about|home)\//.test(text)) problems.push(`${where}: preview asset path left`);
};
for (const [n, t] of blocks) check(`blocks/${n}`, t);
for (const [n, t] of pages) check(`pages/${n}`, t);
check("layout", layout());

const OLD_THEME = /\b(saas_|f_p\b|h_action_promo_area|brdcumb|case_study_details|job_details|tracking_activity|btn_get|wow fadeIn|col-lg-|col-md-|class="container"|class="row"|mt_\d|mb_\d|t_color)/;
for (const [n, t] of pages) if (OLD_THEME.test(t) && !/^(buy|maintenance)$/.test(n)) problems.push(`pages/${n}: old theme markup left (${t.match(OLD_THEME)[0]})`);
for (const [n, t] of blocks) if (OLD_THEME.test(t)) problems.push(`blocks/${n}: old theme markup left (${t.match(OLD_THEME)[0]})`);

// JSON-LD must parse (tokens inside strings are fine)
for (const [n, t] of pages) {
  for (const m of t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1].split("\n").map((l) => l.replace(/^ {2}/, "")).join("\n"));
    } catch (e) {
      problems.push(`pages/${n}: invalid JSON-LD (${e.message})`);
    }
  }
}

/* -------------------------------------------------------------- 7. write */
for (const [name, text] of blocks) write(path.join(OUT, "blocks", `${name}.html`), text);
// Preview helpers used by sync-from-live (not part of the live export)
for (const name of B.EXTRA_PREVIEW) {
  const src = path.join(snap, `${name}.html`);
  if (fs.existsSync(src)) write(path.join(OUT, "blocks", `${name}.html`), read(src).replace(/\s+$/, "") + "\n");
}
for (const [slug, text] of pages) write(path.join(OUT, "pages", slug === ".root" ? ".root.yml" : `${slug}.yml`), text);
write(path.join(OUT, "layout", "Layout.html"), layout());

const removed = backupBlockNames.filter((n) => !blocks.has(n));
const unaccounted = removed.filter((n) => !(n in B.REMOVED));
if (unaccounted.length) problems.push(`blocks neither shipped nor in REMOVED: ${unaccounted.join(", ")}`);

const newBlocks = [...blocks.keys()].filter((n) => !backupBlockNames.includes(n)).sort();
const readme = (await import("./prod/readme.mjs")).render({ cssVer, jsVer, blocks, pages, removed, newBlocks, report: P.report, REMOVED: B.REMOVED, backupBlockNames });
write(path.join(OUT, "README.md"), readme);

fs.rmSync(snap, { recursive: true, force: true });

/* ----------------------------------------------------------------- done */
console.log(`prod-effiling/  blocks: ${blocks.size}  pages: ${pages.size}  (css v=${cssVer}, js v=${jsVer})`);
console.log(`  tier1 (redesigned content): ${P.report.tier1.length}   tier2 (legacy converted): ${P.report.tier2.length}   tier3 (platform): ${P.report.tier3.length}   new: ${P.report.newPages.length}`);
console.log(`  removed blocks: ${removed.length}  new blocks: ${newBlocks.length}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  - " + p);
  process.exitCode = 1;
} else console.log("checks: OK");
