/**
 * JSON-LD handling for prod-effiling.
 *
 * The live export carries 90+ JSON-LD blocks, many of which are invalid JSON (comments,
 * concatenated objects) or contain template placeholders (example.com, "John Doe", fake phone
 * numbers, another company's address, stale prices, expired priceValidUntil, invented reviews).
 *
 * We keep every entity that existed (type + intent), repair/clean it and fix the facts:
 *   - repairs invalid JSON, one <script> per entity
 *   - canonical Organization facts (phone, email, address, logo, sameAs, brand)
 *   - prices come from the live price blocks / service-pricing-catalog.json
 *   - placeholders and fabricated reviews / ratings are dropped
 */
import { SITE } from "./lib.mjs";

export const ORG_NAME = "121 Company Formation";
export const PHONE = "+44-203-8932-121";
export const EMAIL = "info@121companyformation.co.uk";
export const LOGO = `${SITE}/assets/custom/images/logo-wordmark-dark.svg`;
export const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "3rd Floor, 207 Regent Street",
  addressLocality: "London",
  postalCode: "W1B 3HH",
  addressCountry: "GB",
};
export const SAME_AS = [
  "https://www.facebook.com/121companyformation",
  "https://www.instagram.com/121companyformation/",
  "https://www.youtube.com/channel/UCBhNdYV4FSyqO63d1e_faCw",
  "https://www.linkedin.com/company/121-company-formation-ltd",
  "https://www.twitter.com/121CFLtd",
];

/** Prices that match the live price blocks (blocks/*-PACKAGE_*_Price.html). */
export const PACKAGE_PRICES = {
  "lbs-bronze": "110.95",
  "lbs-silver": "75.99",
  "lbs-gold": "192.99",
  "lbs-platinum": "242.99",
  "lbs-diamond": "506.99",
  "llp-bronze": "135.95",
  "llp-silver": "95.99",
  "llp-gold": "212.99",
  "llp-platinum": "262.99",
  "llp-diamond": "526.99",
  "lbg-bronze": "135.95",
  "lbg-silver": "95.99",
  "lbg-gold": "212.99",
  "lbg-platinum": "262.99",
  "lbg-diamond": "526.99",
  international: "286.99",
  "international-plus": "501.99",
};

const TODAY = new Date("2026-11-11");

/* ------------------------------------------------------------ extraction */

const LD_RE = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export function extractLd(body) {
  const raws = [];
  const stripped = body.replace(LD_RE, (_, inner) => {
    raws.push(inner);
    return "";
  });
  return { body: stripped.replace(/\n{3,}/g, "\n\n"), raws };
}

/* --------------------------------------------------------- tolerant parse */

function stripComments(raw) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      out += c;
      continue;
    }
    if (c === "/" && raw[i + 1] === "/") {
      while (i < raw.length && raw[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (c === "/" && raw[i + 1] === "*") {
      i += 2;
      while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
      i++;
      continue;
    }
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/** Split a string into balanced top-level {...} chunks (ignoring anything outside). */
function splitObjects(src) {
  const chunks = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        chunks.push(src.slice(start, i + 1));
        start = -1;
      }
      if (depth < 0) depth = 0;
    }
  }
  return chunks;
}

export function parseLd(raw) {
  const src = stripComments(raw).trim();
  try {
    const j = JSON.parse(src);
    return Array.isArray(j) ? j : [j];
  } catch {
    /* fall through */
  }
  const out = [];
  for (const chunk of splitObjects(src)) {
    try {
      out.push(JSON.parse(chunk));
    } catch {
      /* skip unparsable chunk */
    }
  }
  return out;
}

/* ------------------------------------------------------------- sanitising */

const PLACEHOLDER_HOST = /(example\.com|yourwebsite\.com|efiling\.co\.uk|001formationagent\.co\.uk)/i;
const PLACEHOLDER_URL = /^(URL_FOR_[A-Z_]+|##PAGE_URL##?|)$/;
const BRAND_FIX = [
  [/E-?Filing[’']s/gi, "121 Company Formation’s"],
  [/eFiling\s*-\s*Company Formation/gi, ORG_NAME],
  [/E-?Filing/gi, ORG_NAME],
  [/\b(?:YourCompany|Your Organization Name|001 ?Formation ?Agent|1st Formations?)\b/gi, ORG_NAME],
];

function typesOf(o) {
  const t = o && o["@type"];
  return Array.isArray(t) ? t : t ? [t] : [];
}

function isOrgNode(o) {
  return typesOf(o).some((t) => /Organization|LocalBusiness|Brand|LegalService/.test(t));
}

function canonicalSameAs(list) {
  const out = new Set();
  for (const u of list) {
    const s = String(u).toLowerCase();
    if (s.includes("facebook.com")) out.add(SAME_AS[0]);
    else if (s.includes("instagram.com")) out.add(SAME_AS[1]);
    else if (s.includes("youtube.com")) out.add(SAME_AS[2]);
    else if (s.includes("linkedin.com")) out.add(SAME_AS[3]);
    else if (s.includes("twitter.com") || s.includes("x.com")) out.add(SAME_AS[4]);
  }
  return [...out];
}

function fixUrl(u, ctx, node) {
  if (typeof u !== "string") return u;
  if (PLACEHOLDER_URL.test(u) || PLACEHOLDER_HOST.test(u)) {
    return isOrgNode(node) ? `${SITE}/` : ctx.url;
  }
  return u
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/121companyformation\.co\.uk/i, SITE)
    .replace(/^https:\/\/www\.121companyformation\.com/i, SITE)
    .replace(/^121companyformation\.co\.uk/i, SITE)
    .replace(/^121CompanyFormation\.co\.uk/i, SITE);
}

function brandText(s) {
  let out = s;
  for (const [re, to] of BRAND_FIX) out = out.replace(re, to);
  return out;
}

function isPlaceholderAddress(a) {
  const s = JSON.stringify(a);
  return /123 |Your Address|Blisworth|Shire Barn|EC1A 1AA|Postal Code|NN7 3DB|"City"|"Region"/i.test(s);
}

function hasDeadSearchTarget(act) {
  const t = JSON.stringify(act.target || "");
  return /\/search\?/.test(t) || /search_term_string/.test(t) || /\{search_term/.test(t) || /\{[A-Za-z_]*[sS]earch[A-Za-z_]*\}/.test(t) || /name-check-form/.test(t);
}

export function clean(node, ctx, key = "") {
  if (Array.isArray(node)) {
    const arr = node.map((x) => clean(x, ctx, key)).filter((x) => x !== undefined);
    return arr;
  }
  if (node && typeof node === "object") {
    const types = typesOf(node);

    // Fabricated people (template data)
    if (types.includes("Person") && /\b(john|jane) doe\b/i.test(node.name || "")) return undefined;
    // Invented reviews / ratings
    if (types.includes("Review") || types.includes("AggregateRating")) return undefined;

    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "founders" || k === "founder") {
        const f = clean(v, ctx, k);
        if (f && (!Array.isArray(f) || f.length)) out[k] = f;
        continue;
      }
      if (k === "foundingDate" && v === "2020-01-01") continue;
      if (k === "review" || k === "aggregateRating") continue;
      if (k === "interactionStatistic") {
        // template counters (0 / 1000) are not real analytics
        const keep = [].concat(v).filter((x) => x && ![0, 1000, "0", "1000"].includes(x.userInteractionCount));
        if (keep.length) out[k] = Array.isArray(v) ? keep : keep[0];
        continue;
      }
      if (k === "priceValidUntil" && new Date(v) < TODAY) continue;
      if (/^(price|lowPrice|highPrice)$/.test(k)) {
        if (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v))) out[k] = String(v);
        continue; // non numeric ("Varies", "Custom"…) is invalid for schema.org Offer
      }
      if (k === "telephone") {
        out[k] = PHONE;
        continue;
      }
      if (k === "email") {
        out[k] = EMAIL;
        continue;
      }
      if (k === "address" && v && typeof v === "object") {
        out[k] = isPlaceholderAddress(v) || v.streetAddress ? { ...ADDRESS } : clean(v, ctx, k);
        continue;
      }
      if (k === "logo") {
        out[k] = typeof v === "string" || (v && v.url) ? LOGO : clean(v, ctx, k);
        continue;
      }
      if (k === "image") {
        const s = typeof v === "string" ? v : v && v.url;
        if (typeof s === "string" && /logo/i.test(s)) out[k] = LOGO;
        else if (typeof s === "string" && /\/images\/[^/]+\.jpg$/i.test(s)) continue; // 404 on live
        else if (typeof s === "string" && s) out[k] = fixUrl(s, ctx, node);
        continue;
      }
      if (k === "sameAs") {
        const list = canonicalSameAs(Array.isArray(v) ? v : [v]);
        if (list.length) out[k] = list;
        continue;
      }
      if (k === "potentialAction") {
        const acts = (Array.isArray(v) ? v : [v]).filter((a) => !(typesOf(a).includes("SearchAction") && hasDeadSearchTarget(a)));
        const cleaned = acts.map((a) => clean(a, ctx, k)).filter(Boolean);
        if (cleaned.length) out[k] = Array.isArray(v) ? cleaned : cleaned[0];
        continue;
      }
      if (/^(url|@id|item|mainEntityOfPage|target|urlTemplate)$/.test(k) && typeof v === "string") {
        out[k] = fixUrl(v, ctx, node);
        continue;
      }
      if (typeof v === "string") {
        out[k] = /^https?:\/\//i.test(v) ? fixUrl(v, ctx, node) : brandText(v);
        continue;
      }
      const c = clean(v, ctx, k);
      if (c !== undefined && !(Array.isArray(c) && c.length === 0 && Array.isArray(v) && v.length)) out[k] = c;
    }
    return out;
  }
  if (typeof node === "string") return brandText(node);
  return node;
}

/* ----------------------------------------------------------- serialising */

export function ldScript(entity) {
  const withCtx = entity["@context"] ? entity : { "@context": "https://schema.org", ...entity };
  return `<script type="application/ld+json">\n${JSON.stringify(withCtx, null, 2)}\n</script>`;
}

/** Reasonable fall back when an entity cleaned down to nothing. */
export function isMeaningful(e) {
  return e && typeof e === "object" && Object.keys(e).filter((k) => k !== "@context").length > 1;
}
