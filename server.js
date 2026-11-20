#!/usr/bin/env node
// Serves the static export from out/ behind a shared-token gate, for the
// Render deployment where the real book content lives. GitHub Pages only
// ever serves the public placeholder scaffold — this server is the one
// place real content is shown, and only to requests that prove they have
// the token.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { checkAnalyticsStore, saveAnalyticsVisit, resolveVisitorLocation } from "./lib/analytics-store.js";
import { clientIpFromHeaders, deviceInfoFromHeaders } from "./lib/visit-enrichment.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "out");
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const BOOK_PUBLIC = process.env.BOOK_PUBLIC === "true";
const COOKIE_NAME = "agentic_journey_access";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const VISITOR_COOKIE = "aj_visitor";
const VISITOR_AGE_SECONDS = 60 * 60 * 24 * 365;

if (!ACCESS_TOKEN && !BOOK_PUBLIC) {
  console.error("ACCESS_TOKEN environment variable is required. Refusing to start.");
  process.exit(1);
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".xml": "application/xml; charset=utf-8",
};

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function hasValidAccess(req, url) {
  if (BOOK_PUBLIC) return true;
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[COOKIE_NAME] && timingSafeEqual(cookies[COOKIE_NAME], ACCESS_TOKEN)) return true;
  const token = url.searchParams.get("token");
  return Boolean(token && timingSafeEqual(token, ACCESS_TOKEN));
}

function resolveStaticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const candidates = normalized.endsWith("/")
    ? [path.join(normalized, "index.html")]
    : [normalized, `${normalized}.html`, path.join(normalized, "index.html")];

  for (const candidate of candidates) {
    const fullPath = path.join(OUT_DIR, candidate);
    if (!fullPath.startsWith(OUT_DIR)) continue;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) return fullPath;
  }
  return null;
}

function send401(res) {
  res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<!doctype html><title>Access required</title><body style=\"font-family:sans-serif;background:#0a0a0f;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\"><p>This link needs a valid access token.</p></body>");
}

function send404(res) {
  const notFoundPath = path.join(OUT_DIR, "404.html");
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  if (fs.existsSync(notFoundPath)) fs.createReadStream(notFoundPath).pipe(res);
  else res.end("Not found");
}

function serveFile(req, res, filePath) {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const range = req.headers.range;

  // Browsers commonly require byte-range support for seeking and, on
  // mobile Safari in particular, reliable MP4 playback. The old server
  // always returned 200 with the entire file, even when the video element
  // requested a range.
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      res.end();
      return;
    }

    let start;
    let end;
    if (match[1] === "" && match[2] !== "") {
      const suffixLength = Number(match[2]);
      start = Math.max(0, stat.size - suffixLength);
      end = stat.size - 1;
    } else {
      start = match[1] === "" ? 0 : Number(match[1]);
      end = match[2] === "" ? stat.size - 1 : Number(match[2]);
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      res.end();
      return;
    }

    end = Math.min(end, stat.size - 1);
    res.writeHead(206, {
      "Content-Type": contentType,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
  });
  fs.createReadStream(filePath).pipe(res);
}

function trackBookVisit(req, res) {
  if (!BOOK_PUBLIC || req.method !== "POST") {
    res.writeHead(404);
    res.end();
    return;
  }
  const host = req.headers.host;
  const origin = req.headers.origin;
  let matchingOrigin = !origin;
  if (origin) {
    try {
      matchingOrigin = new URL(origin).host === host;
    } catch {
      matchingOrigin = false;
    }
  }
  if (!host || !matchingOrigin) {
    res.writeHead(403);
    res.end();
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 2048) req.destroy();
  });
  req.on("end", async () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    const pathname = typeof payload.path === "string" ? payload.path : "";
    const validPath = /^\/$|^\/(book\/[a-z0-9-]+|for-the-users|dedication|acknowledgments|about|citations)\/?$/.test(pathname);
    if (!validPath) {
      res.writeHead(400);
      res.end();
      return;
    }
    const cookies = parseCookies(req.headers.cookie);
    const previous = cookies[VISITOR_COOKIE];
    const returning = typeof previous === "string" && /^[0-9a-f]{32}$/.test(previous);
    const visitor = returning ? previous : crypto.randomBytes(16).toString("hex");
    const visitorHash = crypto.createHash("sha256").update(visitor).digest("hex").slice(0, 24);
    const source = typeof payload.source === "string" && /^[a-z0-9.-]{1,100}$/.test(payload.source)
      ? payload.source : "direct";
    const ip = clientIpFromHeaders(req.headers);
    const device = deviceInfoFromHeaders(req.headers);
    let stats;
    try {
      const location = await resolveVisitorLocation(ip);
      stats = await saveAnalyticsVisit({
        visitor: visitorHash,
        path: pathname,
        source,
        day: new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }),
        ip,
        location,
        device,
        language: typeof payload.language === "string" ? payload.language.slice(0, 35) : "",
        timeZone: typeof payload.timeZone === "string" ? payload.timeZone.slice(0, 75) : "",
      });
    } catch (error) {
      console.error("BOOK_ANALYTICS_WRITE_FAILED", error.message);
      res.writeHead(503, { "Cache-Control": "no-store" });
      res.end();
      return;
    }
    console.log("BOOK_VISIT_PERSISTED " + JSON.stringify({
      visitor: visitorHash,
      newVisitor: stats.first === 1,
      path: pathname,
      source,
      country: stats.country,
      region: stats.region,
      city: stats.city,
      browser: device.browser,
      platform: device.platform,
      device: device.device,
      readers: stats.readers,
      views: stats.views,
      chapterViews: stats.chapterViews,
      dayReaders: stats.dayReaders,
      dayViews: stats.dayViews,
      at: new Date().toISOString(),
    }));
    const headers = { "Cache-Control": "no-store" };
    if (!returning) {
      headers["Set-Cookie"] = `${VISITOR_COOKIE}=${visitor}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${VISITOR_AGE_SECONDS}`;
    }
    res.writeHead(204, headers);
    res.end();
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/__book_visit") {
    trackBookVisit(req, res);
    return;
  }

  if (!hasValidAccess(req, url)) {
    send401(res);
    return;
  }

  const queryToken = url.searchParams.get("token");
  if (queryToken && (BOOK_PUBLIC || timingSafeEqual(queryToken, ACCESS_TOKEN))) {
    url.searchParams.delete("token");
    const headers = { Location: url.pathname + url.search };
    if (!BOOK_PUBLIC) {
      headers["Set-Cookie"] = `${COOKIE_NAME}=${encodeURIComponent(ACCESS_TOKEN)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}`;
    }
    res.writeHead(302, headers);
    res.end();
    return;
  }

  const filePath = resolveStaticFile(url.pathname);
  if (!filePath) {
    send404(res);
    return;
  }

  serveFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log(`Book server listening on port ${PORT}`);
  if (BOOK_PUBLIC) {
    checkAnalyticsStore()
      .then(() => console.log("BOOK_ANALYTICS_READY"))
      .catch((error) => console.error("BOOK_ANALYTICS_UNAVAILABLE", error.message));
  }
});
