#!/usr/bin/env node
// Serves the static export from out/ behind a shared-token gate, for the
// Render deployment where the real book content lives. GitHub Pages only
// ever serves the public placeholder scaffold — this server is the one
// place real content is shown, and only to requests that prove they have
// the token.
//
// Flow: a request with ?token=<ACCESS_TOKEN> in the URL gets an
// HttpOnly/Secure cookie set and is redirected to the clean URL (so the
// token doesn't linger in the address bar, browser history, or Referer
// headers of any link clicked from the page). A request with a valid
// cookie is served normally. Anything else gets 401.
//
// No dependencies — Node's built-in http/fs/crypto only, to match this
// project's minimal-dependency convention.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "out");
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const COOKIE_NAME = "agentic_journey_access";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // ~180 days

if (!ACCESS_TOKEN) {
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

/** Constant-time string comparison, so token checking can't leak timing info. */
function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal-length buffers so the failure path
    // takes comparable time regardless of length mismatch.
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
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[COOKIE_NAME] && timingSafeEqual(cookies[COOKIE_NAME], ACCESS_TOKEN)) {
    return true;
  }
  const token = url.searchParams.get("token");
  return Boolean(token && timingSafeEqual(token, ACCESS_TOKEN));
}

/** Resolves a request pathname to a file under OUT_DIR, or null if none exists. Never escapes OUT_DIR. */
function resolveStaticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const candidates = normalized.endsWith("/")
    ? [path.join(normalized, "index.html")]
    : [normalized, `${normalized}.html`, path.join(normalized, "index.html")];

  for (const candidate of candidates) {
    const fullPath = path.join(OUT_DIR, candidate);
    if (!fullPath.startsWith(OUT_DIR)) continue; // defense in depth against traversal
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
}

function send401(res) {
  res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    "<!doctype html><title>Access required</title><body style=\"font-family:sans-serif;background:#0a0a0f;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\"><p>This link needs a valid access token.</p></body>"
  );
}

function send404(res) {
  const notFoundPath = path.join(OUT_DIR, "404.html");
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  if (fs.existsSync(notFoundPath)) {
    fs.createReadStream(notFoundPath).pipe(res);
  } else {
    res.end("Not found");
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (!hasValidAccess(req, url)) {
    send401(res);
    return;
  }

  // A request that just proved access via the query token gets the cookie
  // set and is bounced to the clean URL, so the token stops appearing in
  // the address bar, browser history, or outgoing Referer headers.
  const queryToken = url.searchParams.get("token");
  if (queryToken && timingSafeEqual(queryToken, ACCESS_TOKEN)) {
    url.searchParams.delete("token");
    res.writeHead(302, {
      "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(ACCESS_TOKEN)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
      Location: url.pathname + url.search,
    });
    res.end();
    return;
  }

  const filePath = resolveStaticFile(url.pathname);
  if (!filePath) {
    send404(res);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Token-gated server listening on port ${PORT}`);
});
