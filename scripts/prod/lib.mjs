/**
 * Shared helpers for scripts/build-prod-effiling.mjs
 *
 * prod-effiling/ mirrors the eFiling Web Builder export in ../prod-backup/prod-backup
 * (blocks/*.html + pages/**.yml) but carries the redesign (design + content).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BACKUP = path.resolve(
  process.env.PROD_BACKUP || path.join(ROOT, "..", "prod-backup", "prod-backup")
);
export const OUT = path.join(ROOT, "prod-effiling");

export const SITE = "https://www.121companyformation.co.uk";

/* ------------------------------------------------------------------ IO */

/** Read UTF-8, drop BOM, normalise to LF (output is converted back to CRLF like the export). */
export function read(file) {
  return fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
}

export function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"), "utf8");
}

export function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

export function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

export const rel = (base, file) => path.relative(base, file).split(path.sep).join("/");

/* ------------------------------------------------------- page .yml I/O */

/**
 * The export format is:
 *   "##KEY#": value
 *   ...
 *   "URL": /x/
 *   "Body": |
 *     <html indented by two spaces>
 */
export function parsePage(text) {
  text = text.replace(/\r\n/g, "\n");
  const marker = '\n"Body": |';
  const idx = text.indexOf(marker);
  if (idx < 0) throw new Error("page without Body");
  const headText = text.slice(0, idx);
  let rest = text.slice(idx + marker.length);
  rest = rest.replace(/^[^\n]*\n/, "");
  const lines = rest.split("\n");
  const body = lines.map((l) => (l.startsWith("  ") ? l.slice(2) : l.replace(/^ /, ""))).join("\n");
  const head = [];
  for (const line of headText.split("\n")) {
    const m = line.match(/^"([^"]+)":[ ]?(.*)$/);
    if (m) head.push({ key: m[1], value: m[2] });
  }
  return { head, body };
}

export function getField(page, key) {
  const f = page.head.find((h) => h.key === key);
  return f ? f.value : undefined;
}

/** Return a plain string for a raw YAML scalar (strips surrounding quotes). */
export function plain(raw) {
  if (raw === undefined) return "";
  raw = raw.trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    try {
      return raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1).replace(/''/g, "'");
    } catch {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

/** Serialise a JS string as a YAML scalar compatible with the export (quote only when needed). */
export function yamlScalar(s) {
  if (s === "" || s === undefined || s === null) return "";
  s = String(s);
  if (/^[A-Za-z0-9£$(][^:#\n"'{}\[\],&*!|>%@`]*$/.test(s) && !/\s$/.test(s) && !/: /.test(s)) return s;
  return JSON.stringify(s);
}

export function setField(page, key, rawValue) {
  const f = page.head.find((h) => h.key === key);
  if (f) f.value = rawValue;
  else {
    // keep the URL / templates last
    const i = page.head.findIndex((h) => h.key === "URL");
    page.head.splice(i < 0 ? page.head.length : i, 0, { key, value: rawValue });
  }
}

export function serializePage(page, body) {
  // The export writes an empty value as `"KEY": ` (trailing space) – keep that shape
  const headText = page.head.map((h) => `"${h.key}": ${h.value}`);
  const b = body.replace(/^\s*\n/, "").replace(/\s+$/, "") + "\n";
  const indented = b
    .split("\n")
    .map((l) => (l.length ? "  " + l : ""))
    .join("\n");
  return headText.join("\n") + '\n"Body": | \n' + indented;
}

/* ------------------------------------------------------ text transforms */

/** Redesign blocks/pages were authored for the static preview (/assets/...); eFiling uses /assets/custom/... */
export function mapAssets(html) {
  return html
    .replace(/\/assets\/logo\//g, "/assets/custom/images/")
    .replace(/\/assets\/banking\//g, "/assets/custom/images/banking/")
    .replace(/\/assets\/about\/(about-us-pic\d\.jpg)/g, "/assets/custom/images/img/$1");
}

/** The static preview inlined package prices; production keeps the live price blocks. */
const PRICE_TOKENS = [
  ["£110.95", "##LBS-PACKAGE_BRONZE_Price#"],
  ["£192.99", "##LBS-PACKAGE_GOLD_Price#"],
  ["£242.99", "##LBS-PACKAGE_PLATINUM_Price#"],
  ["£506.99", "##LBS-PACKAGE_DIAMOND_Price#"],
];
export function restorePriceTokens(html) {
  let out = html;
  for (const [price, token] of PRICE_TOKENS) out = out.split(price).join(token);
  return out;
}

/** Display text of the WhatsApp number comes from the WHATSAPP_NUMBER block in production. */
export function useWhatsappBlock(html) {
  return html.split("+44 (0) 798 4046 470").join("##WHATSAPP_NUMBER#");
}

export function stripLeadingComment(html) {
  return html.replace(/^(?:\s*<!--[\s\S]*?-->\s*)+/, "");
}

export function stripBlockComment(html) {
  return html.replace(/^\s*<!-- Block:[\s\S]*?-->\s*/, "");
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function decodeEntities(s) {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&pound;/gi, "£")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

export function textOnly(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
