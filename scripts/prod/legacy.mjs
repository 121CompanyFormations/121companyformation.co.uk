/**
 * Convert legacy (saas_/bootstrap) page markup from the live export into the redesign's
 * semantic markup (cf-prose + cf-faq + cf-table-wrap). Used only for pages that have no
 * hand-written redesign content in pages/*-content.html.
 */
import { decodeEntities, textOnly, escapeHtml } from "./lib.mjs";

const UNWRAP = new Set(["div", "section", "article", "span", "font", "center", "main", "header", "footer", "aside", "figure", "figcaption", "nav", "form", "label"]);

function tokenize(html) {
  const out = [];
  const re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+|</g;
  let m;
  while ((m = re.exec(html))) out.push(m[0]);
  return out;
}

function tagName(tok) {
  const m = tok.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  return m ? m[1].toLowerCase() : "";
}

/** Remove layout wrappers (div/section/span/font/…) that carry no `cf-` class, keeping their children. */
function unwrapLayout(html) {
  const stack = [];
  const out = [];
  for (const tok of tokenize(html)) {
    if (!tok.startsWith("<") || tok.startsWith("<!--")) {
      out.push(tok);
      continue;
    }
    const name = tagName(tok);
    const closing = tok.startsWith("</");
    const selfClosing = /\/>$/.test(tok) || ["br", "hr", "img", "input", "meta", "link"].includes(name);
    if (!UNWRAP.has(name)) {
      out.push(tok);
      continue;
    }
    if (!closing) {
      if (selfClosing) continue;
      const keep = /class="[^"]*\bcf-/.test(tok);
      stack.push({ name, keep });
      if (keep) out.push(tok);
    } else {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].name !== name) i--;
      if (i < 0) continue; // stray closer
      const top = stack[i];
      stack.length = i;
      if (top.keep) out.push(tok);
    }
  }
  return out.join("");
}

const KEEP_ATTRS = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  iframe: ["src", "title", "allowfullscreen"],
  ol: ["start"],
};

function cleanAttrs(html) {
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*?)?(\/?)>/g, (all, name, attrs = "", slash) => {
    const n = name.toLowerCase();
    if (/class="[^"]*\bcf-/.test(attrs)) return all;
    const keep = KEEP_ATTRS[n] || [];
    const kept = [];
    for (const m of attrs.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
      const an = m[1].toLowerCase();
      if (!keep.includes(an)) continue;
      let val = m[2] === undefined ? "" : m[2].replace(/^['"]|['"]$/g, "");
      if (an === "href") val = normaliseHref(val);
      if (an === "target" && !/^_blank$/i.test(val)) continue;
      kept.push(m[2] === undefined ? an : `${an}="${val}"`);
    }
    if (n === "a" && kept.some((k) => k.startsWith("target=")) && !kept.some((k) => k.startsWith("rel="))) kept.push('rel="noopener"');
    if (n === "img" && !kept.some((k) => k.startsWith("alt="))) kept.push('alt=""');
    if (n === "img") kept.push('loading="lazy"');
    return `<${n}${kept.length ? " " + kept.join(" ") : ""}${slash ? " /" : ""}>`;
  });
}

export function normaliseHref(h) {
  const stripped = h.replace(/^https?:\/\/(?:www\.)?121companyformation\.(?:co\.uk|com)(?=\/|$)/i, "");
  if (stripped !== h) return stripped === "" ? "/" : stripped;
  return h === "" ? "#" : h;
}

function accordionToDetails(html) {
  const re = /<div[^>]*class="card"[^>]*>\s*<div[^>]*class="card-header"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="collapse[^"]*"[^>]*>\s*<div[^>]*class="card-body"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let found = 0;
  let out = html.replace(re, (_, head, body) => {
    found++;
    const q = textOnly(head);
    return `<details><summary>${escapeHtml(q)}</summary><div class="cf-faq__body"><p>${body.trim()}</p></div></details>`;
  });
  if (found) {
    out = out.replace(/((?:<details>[\s\S]*?<\/details>\s*)+)/g, (m) => `<div class="cf-faq cf-faq--page">${m.trim()}</div>`);
  }
  return { html: out, faq: found };
}

export function convertLegacy(src, opts = {}) {
  let h = src;

  // tracking / presentational noise
  h = h.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/<style[\s\S]*?<\/style>/gi, "");
  h = h.replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, "");
  h = h.replace(/<p[^>]*class="[^"]*(?:brdcumb|breadcumdata)[^"]*"[^>]*>[\s\S]*?<\/p>/gi, "");
  h = h.replace(/<(?:button|input|select|textarea)[\s\S]*?(?:<\/(?:button|select|textarea)>|\/?>)/gi, "");

  // accordion → details/summary before attributes are stripped
  const acc = accordionToDetails(h);
  h = acc.html;

  h = h.replace(/<i\b[^>]*>\s*<\/i>/gi, "").replace(/<b>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
  h = unwrapLayout(h);

  // sidebar blocks that were inline text tokens
  h = h.replace(/##RECENTPOSTS_BLOG#/g, "").replace(/^\s*RECENTPOSTS_BLOG\s*/m, "");

  h = cleanAttrs(h);

  // headings: lone h1 becomes the hero title (caller) – otherwise demote
  let title = "";
  const h1 = h.match(/<h1>([\s\S]*?)<\/h1>/i);
  if (h1) {
    title = textOnly(h1[1]);
    if (opts.removeH1 !== false) h = h.replace(h1[0], "");
  }
  h = h.replace(/<h1>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>");
  h = h.replace(/<h([2-6])>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h\1>/gi, "<h$1>$2</h$1>");

  // <br><br> → paragraph breaks; stray &nbsp; lines; empty blocks
  h = h.replace(/(?:<br\s*\/?>\s*){2,}/gi, "</p><p>");
  h = h.replace(/(^|>)\s*(?:&nbsp;| )+\s*(?=<|$)/g, "$1");
  h = h.replace(/<(p|h[2-6]|li|ul|ol|strong|em|a)\b[^>]*>\s*(?:&nbsp;| |\s)*<\/\1>/gi, "");
  h = h.replace(/<(p|h[2-6]|li|ul|ol)\b[^>]*>\s*<\/\1>/gi, "");

  // tables
  h = h.replace(/<table[^>]*>/gi, '<div class="cf-table-wrap"><table class="cf-table">').replace(/<\/table>/gi, "</table></div>");

  // whitespace tidy: collapse, keep inline text inline, one block per line
  h = h.replace(/\s+/g, " ");
  h = h.replace(/(<(?:a|strong|em|u|small)\b[^>]*>)\s+/gi, "$1").replace(/\s+(<\/(?:a|strong|em|u|small)>)/gi, "$1");
  h = h.replace(/(<\/(?:a|strong|em)>)\s+([,.;:!?])/g, "$1$2");
  h = h.replace(/\s*(<\/?(?:ul|ol|div|section|table|thead|tbody|tr|details|blockquote|hr|aside|article)\b[^>]*>)\s*/gi, "\n$1\n");
  h = h.replace(/\s*(<(?:p|li|h[1-6]|td|th|summary)\b[^>]*>)\s*/gi, "\n$1");
  h = h.replace(/\s*(<\/(?:p|li|h[1-6]|td|th|summary)>)\s*/gi, "$1\n");
  h = h.replace(/\n{2,}/g, "\n").trim();

  return { html: h, title, faq: acc.faq };
}

/** Plain text (for FAQ visibility checks etc.) */
export function visibleText(html) {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").toLowerCase();
}
