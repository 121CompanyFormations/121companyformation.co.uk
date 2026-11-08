import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://www.121companyformation.co.uk";
const OUT = path.join(ROOT, "live-html");

const URLS = [
  "/",
  "/packages/",
  "/lbs-bronze/",
  "/lbs-gold/",
  "/lbs-platinum/",
  "/lbs-diamond/",
  "/lbs-silver/",
  "/registered-office-address/",
  "/service-address/",
  "/trade-mail-forwarding/",
  "/renewals/",
  "/confirmation-statement-service/",
  "/company-closure/",
  "/company-name-change/",
  "/vat-registration/",
  "/director-appointment-and-resignation/",
  "/business-telephone-service/",
  "/transfer-of-shares/",
  "/allocation-of-shares/",
  "/certificate-of-good-standing/",
  "/business-banking/",
  "/year-end-accounts/",
  "/corporation-tax/",
  "/bookkeeping/",
  "/vat-returns/",
  "/payroll-and-paye/",
  "/dormant-company-account/",
  "/director-salary-and-dividends/",
  "/online-company-name-search-tool/",
  "/post-incorporation-activities/",
  "/admin-portal-to-manage-your-companies/",
  "/our-4-step-guide-to-setting-up-a-company/",
  "/company-formation-checklist/",
  "/introduction-to-company-formation/",
  "/company-director/",
  "/company-secretary/",
  "/limited-company-shareholders/",
  "/limited-by-shares/",
  "/limited-by-guarantee-company/",
  "/limited-liability-partnership/",
  "/about-us/",
  "/contact-us/",
  "/frequently-asked-questions/",
  "/terms-and-conditions/",
  "/refund-and-cancellation-policy/",
  "/privacy-policy/",
  "/terms/",
  "/blog/",
];

function slugFromUrl(u) {
  if (u === "/") return "home";
  return u.replace(/^\/|\/$/g, "").replace(/\//g, "__") || "home";
}

function fetchPage(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; 121-redesign-crawl/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 30000,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 5
        ) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : BASE + res.headers.location;
          res.resume();
          return fetchPage(next, redirects + 1).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            html: Buffer.concat(chunks).toString("utf8"),
          })
        );
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout " + url));
    });
  });
}

fs.mkdirSync(OUT, { recursive: true });
const index = [];

for (const u of URLS) {
  const full = BASE + u;
  process.stdout.write(`GET ${u} ... `);
  try {
    const { status, html } = await fetchPage(full);
    const slug = slugFromUrl(u);
    const file = path.join(OUT, `${slug}.html`);
    fs.writeFileSync(file, html, "utf8");
    index.push({
      url: u,
      status,
      file: `live-html/${slug}.html`,
      bytes: html.length,
    });
    console.log(`${status} (${html.length} bytes)`);
  } catch (e) {
    index.push({ url: u, status: "error", error: String(e.message || e) });
    console.log(`ERROR ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 2));
const ok = index.filter((i) => i.status === 200).length;
const bad = index.filter((i) => i.status !== 200).length;
console.log(`\nDone: ${ok} ok, ${bad} failed. Saved under live-html/`);
