/**
 * Build eFiling deliverables (same role as 001formationagent `gulp build`):
 *   dist/app_min.js   – functions + main + cf-app (minified)
 *   dist/app_min.css   – marketing cf-site.css + eFiling theme SCSS (minified)
 *   dist/efiling-*.html paste snippets for ##CSS# / ##JAVASCRIPT#
 *
 * Source layout mirrors 001:
 *   dev/static/scss/  → eFiling backoffice theme
 *   dev/static/js/    → buy-flow + redesign UI
 *   css/cf-site.css   → marketing redesign
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as esbuild from "esbuild";
import * as sass from "sass";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const JS_FILES = require(path.join(ROOT, "gulp", "includes", "js.js"));
const SCSS_ENTRY = path.join(ROOT, "dev", "static", "scss", "styles.scss");
const MARKETING_CSS = path.join(ROOT, "css", "cf-site.css");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function assetVersion(filePath) {
  const st = fs.statSync(filePath);
  return `${st.size}-${Math.floor(st.mtimeMs)}`;
}

async function buildJs() {
  const outfile = path.join(DIST, "app_min.js");
  const parts = JS_FILES.map((f) => {
    const abs = path.join(ROOT, f.replace(/^\.\//, ""));
    return fs.readFileSync(abs, "utf8");
  });
  const tmp = path.join(DIST, "_app.combined.js");
  fs.writeFileSync(tmp, parts.join("\n;\n"), "utf8");
  await esbuild.build({
    entryPoints: [tmp],
    outfile,
    minify: true,
    bundle: true,
    target: ["es2018"],
    format: "iife",
    legalComments: "none",
  });
  fs.unlinkSync(tmp);
  return outfile;
}

async function buildCss() {
  const efilling = sass.compile(SCSS_ENTRY, {
    style: "expanded",
    loadPaths: [path.join(ROOT, "dev", "static", "scss")],
  });
  const efillingCss = String(efilling.css).replace(/^@charset[^;]+;\s*/i, "");

  const marketing = fs.readFileSync(MARKETING_CSS, "utf8");
  const combined = `/* marketing: css/cf-site.css */\n${marketing}\n\n/* eFiling theme: dev/static/scss/styles.scss */\n${efillingCss}\n`;

  const tmp = path.join(DIST, "_app.combined.css");
  fs.writeFileSync(tmp, combined, "utf8");

  const outfile = path.join(DIST, "app_min.css");
  await esbuild.build({
    entryPoints: [tmp],
    outfile,
    minify: true,
    bundle: false,
    loader: { ".css": "css" },
    legalComments: "none",
  });
  fs.unlinkSync(tmp);
  return outfile;
}

async function build() {
  ensureDir(DIST);

  const jsOut = await buildJs();
  const cssOut = await buildCss();

  const v = assetVersion(cssOut);
  fs.writeFileSync(
    path.join(DIST, "efiling-javascript.html"),
    `<script src="/assets/custom/files/app_min.js?v=${v}"></script>\n`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(DIST, "efiling-css.html"),
    `<!-- Upload dist/app_min.css to Asset Manager, then use: -->\n<link rel="stylesheet" href="/assets/custom/files/app_min.css?v=${v}" />\n`,
    "utf8"
  );

  const siteJs = path.join(ROOT, "js");
  ensureDir(siteJs);
  fs.copyFileSync(jsOut, path.join(siteJs, "app_min.js"));
  fs.copyFileSync(cssOut, path.join(ROOT, "css", "app_min.css"));

  console.log(`dist/app_min.js  ${(fs.statSync(jsOut).size / 1024).toFixed(1)} KB`);
  console.log(`dist/app_min.css ${(fs.statSync(cssOut).size / 1024).toFixed(1)} KB`);
  console.log(`asset version v=${v}`);
  console.log("Done. (marketing CSS + eFiling SCSS + buy-flow JS)");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
