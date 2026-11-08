/**
 * Build eFiling deliverables into dist/:
 *   dist/app_min.js
 *   dist/app_min.css
 *   dist/efiling-javascript.html  (paste into ##JAVASCRIPT#)
 *   dist/efiling-css.html         (paste into ##CSS# or use as link hint)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const JS_SRC = path.join(ROOT, "src", "js", "cf-app.js");
const CSS_SRC = path.join(ROOT, "css", "cf-site.css");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function assetVersion() {
  const st = fs.statSync(CSS_SRC);
  return `${st.size}-${Math.floor(st.mtimeMs)}`;
}

async function build() {
  ensureDir(DIST);

  await esbuild.build({
    entryPoints: [JS_SRC],
    outfile: path.join(DIST, "app_min.js"),
    minify: true,
    bundle: true,
    target: ["es2018"],
    format: "iife",
    legalComments: "none",
  });

  await esbuild.build({
    entryPoints: [CSS_SRC],
    outfile: path.join(DIST, "app_min.css"),
    minify: true,
    bundle: false,
    loader: { ".css": "css" },
    legalComments: "none",
  });

  const v = assetVersion();
  const jsTag = `<script src="/assets/custom/files/app_min.js?v=${v}"></script>\n`;
  const cssTag = `<!-- Upload dist/app_min.css to Asset Manager, then use: -->
<link rel="stylesheet" href="/assets/custom/files/app_min.css?v=${v}" />
`;

  fs.writeFileSync(path.join(DIST, "efiling-javascript.html"), jsTag, "utf8");
  fs.writeFileSync(path.join(DIST, "efiling-css.html"), cssTag, "utf8");

  // Convenience copies for static site preview (absolute /js /css paths)
  const siteJs = path.join(ROOT, "js");
  ensureDir(siteJs);
  fs.copyFileSync(path.join(DIST, "app_min.js"), path.join(siteJs, "app_min.js"));
  fs.copyFileSync(path.join(DIST, "app_min.css"), path.join(ROOT, "css", "app_min.css"));

  const jsSize = fs.statSync(path.join(DIST, "app_min.js")).size;
  const cssSize = fs.statSync(path.join(DIST, "app_min.css")).size;
  console.log(`dist/app_min.js  ${(jsSize / 1024).toFixed(1)} KB`);
  console.log(`dist/app_min.css ${(cssSize / 1024).toFixed(1)} KB`);
  console.log(`asset version v=${v}`);
  console.log("Done.");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
