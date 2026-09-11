#!/usr/bin/env node
// Converts docs/private/chapters/*.md into content/book/book/*.mdx.
//
// This runs at Render build time only — it clones the private content
// repo into docs/private first (see render.yaml), runs this script, then
// builds. The output never gets committed to the public repo; real prose
// only ever exists inside Render's build environment and the served
// static output behind the token gate.
//
// Mirrors scripts/sync-preview-content.mjs's conversion logic (Obsidian
// image embeds, leading-heading stripping, frontmatter shape).

import fs from "node:fs";
import path from "node:path";
import { verifyMdxDir, reportMdxFailures } from "./lib/verify-mdx.mjs";
import { CHAPTERS } from "./lib/chapters.mjs";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "docs/private/chapters");
const OUTPUT_DIR = path.join(ROOT, "content/book/book");
const PRIVATE_DIR = path.join(ROOT, "docs/private");
const IMAGES_OUT_DIR = path.join(ROOT, "public/book-images");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

function findImageFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findImageFiles(fullPath));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      found.push(fullPath);
    }
  }
  return found;
}

function slugifyFilename(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  return base.replace(/\s+/g, "-").toLowerCase() + ext.toLowerCase();
}

function buildImageMap() {
  const map = new Map();
  for (const fullPath of findImageFiles(PRIVATE_DIR)) {
    const originalName = path.basename(fullPath);
    const safeName = slugifyFilename(originalName);
    map.set(originalName, { fullPath, safeName });
  }
  return map;
}

function copyImages(imageMap) {
  fs.rmSync(IMAGES_OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMAGES_OUT_DIR, { recursive: true });
  for (const { fullPath, safeName } of imageMap.values()) {
    fs.copyFileSync(fullPath, path.join(IMAGES_OUT_DIR, safeName));
  }
}

function rewriteImages(content, imageMap) {
  const resolve = (originalName) => {
    const hit = imageMap.get(originalName.trim());
    return hit ? `/book-images/${hit.safeName}` : null;
  };

  content = content.replace(
    /!\[\[([^\]|]+)(?:\|(\d+))?\]\]/g,
    (match, filename, width) => {
      const src = resolve(filename);
      if (!src) return match;
      return width
        ? `<img src="${src}" width="${width}" alt="" />`
        : `<img src="${src}" alt="" />`;
    }
  );

  content = content.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (match, altText, filename) => {
      if (/^https?:\/\//.test(filename) || filename.startsWith("/")) return match;
      const src = resolve(filename);
      if (!src) return match;
      const widthMatch = altText.match(/\|(\d+)$/);
      const width = widthMatch ? widthMatch[1] : null;
      return width
        ? `<img src="${src}" width="${width}" alt="" />`
        : `<img src="${src}" alt="${altText}" />`;
    }
  );

  return content;
}

function stripLeadingHeading(content, title) {
  const lines = content.replace(/^﻿/, "").split("\n");
  const first = lines[0]?.trim();
  if (first === `# ${title}` || first === `## ${title}` || first === `### ${title}`) {
    lines.shift();
    while (lines[0] !== undefined && lines[0].trim() === "") lines.shift();
  }
  return lines.join("\n");
}

function yamlString(value) {
  return JSON.stringify(value);
}

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const imageMap = buildImageMap();
copyImages(imageMap);

let promoted = 0;
let missing = 0;

CHAPTERS.forEach((chapter, i) => {
  const sourcePath = path.join(SOURCE_DIR, chapter.file);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  (missing, skipped) ${chapter.file}`);
    missing += 1;
    return;
  }

  const raw = fs.readFileSync(sourcePath, "utf-8");
  const withoutHeading = stripLeadingHeading(raw, chapter.title);
  const body = rewriteImages(withoutHeading, imageMap);
  const previous = i > 0 ? CHAPTERS[i - 1].slug : null;
  const next = i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].slug : null;

  const frontmatter = [
    "---",
    `title: ${yamlString(chapter.title)}`,
    `slug: ${yamlString(chapter.slug)}`,
    `part: book`,
    `partTitle: ${yamlString("")}`,
    `chapterNumber: ${i + 1}`,
    `summary: ${yamlString("")}`,
    `status: published`,
    `previous: ${previous ? yamlString(previous) : "null"}`,
    `next: ${next ? yamlString(next) : "null"}`,
    "---",
    "",
  ].join("\n");

  const outPath = path.join(
    OUTPUT_DIR,
    `${String(i + 1).padStart(2, "0")}-${chapter.slug}.mdx`
  );
  fs.writeFileSync(outPath, frontmatter + body);
  promoted += 1;
});

console.log(
  `Promoted ${promoted} chapter(s) into ${path.relative(ROOT, OUTPUT_DIR)}/ ` +
    `and ${imageMap.size} image(s) into ${path.relative(ROOT, IMAGES_OUT_DIR)}/` +
    (missing ? ` (${missing} chapter file(s) missing)` : "")
);

// Fail the Render build here, with a clear per-chapter error, rather than
// shipping a chapter that only fails at request time in a reader's
// browser with a cryptic MDX parser error.
const failures = await verifyMdxDir(OUTPUT_DIR);
if (reportMdxFailures(failures, ROOT)) {
  process.exit(1);
}
console.log(`✓ All promoted chapters compile.`);
