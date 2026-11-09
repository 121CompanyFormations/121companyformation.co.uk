/**
 * Tiny static preview server.
 * Prefer index.html inside directories (unlike `serve` when a folder has package subdirs).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "site");
const PORT = Number(process.env.PORT || 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const cleaned = decoded.replace(/^\/+/, "").replace(/\\/g, "/");
  const abs = path.resolve(root, cleaned);
  if (!abs.startsWith(root)) return null;
  return abs;
}

function send(res, code, body, type) {
  res.writeHead(code, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath)
    .on("error", () => {
      if (!res.headersSent) send(res, 500, "Read error");
      else res.destroy();
    })
    .pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let target = safeJoin(ROOT, url.pathname);
  if (!target) return send(res, 403, "Forbidden");

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const index = path.join(target, "index.html");
    if (fs.existsSync(index)) target = index;
    else return send(res, 404, "Not found");
  } else if (!path.extname(target) && fs.existsSync(target + ".html")) {
    target = target + ".html";
  } else if (!fs.existsSync(target) && fs.existsSync(path.join(target, "index.html"))) {
    target = path.join(target, "index.html");
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    return send(res, 404, "Not found");
  }
  return sendFile(res, target);
});

server.listen(PORT, () => {
  console.log(`Preview http://localhost:${PORT}/  (root ${ROOT})`);
});
