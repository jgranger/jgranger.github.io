#!/usr/bin/env node
// Syncs docs/private/chapters/*.md into content/book-preview/book/*.mdx so
// `npm run preview` can render the real chapter drafts in the actual site
// design. content/book-preview/ is gitignored — this script never touches
// anything tracked by git, so there's no path by which private prose can
// end up committed to this public repo.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "docs/private/chapters");
const OUTPUT_DIR = path.join(ROOT, "content/book-preview/book");
const PRIVATE_DIR = path.join(ROOT, "docs/private");
const IMAGES_OUT_DIR = path.join(ROOT, "public/preview-images");

// Order matches docs/private/book-vision.md's current Chapter Structure
// exactly. Update this list if that order ever changes.
const CHAPTERS = [
  { file: "01-one-problem-worth-solving.md", slug: "one-problem-worth-solving", title: "One Problem Worth Solving" },
  { file: "02-the-ideas-factory.md", slug: "the-ideas-factory", title: "The Ideas Factory" },
  { file: "03-ask-product-from-agent-to-platform.md", slug: "ask-product-from-agent-to-platform", title: "Ask Product - From Agent to Platform" },
  { file: "04-the-grid-needs-a-guardian.md", slug: "the-grid-needs-a-guardian", title: "The Grid Needs a Guardian" },
  { file: "05-context-engineering.md", slug: "context-engineering", title: "Context Engineering" },
  { file: "06-fastlane.md", slug: "fastlane", title: "Fastlane" },
  { file: "07-graph-engineering.md", slug: "graph-engineering", title: "Graph Engineering" },
  { file: "08-intelligence-in-the-middle.md", slug: "intelligence-in-the-middle", title: "Intelligence in the Middle" },
  { file: "09-the-flywheel.md", slug: "the-flywheel", title: "The Flywheel" },
  { file: "10-organizational-learning.md", slug: "organizational-learning", title: "Organizational Learning" },
  { file: "11-looking-forward.md", slug: "looking-forward", title: "Looking Forward" },
];

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

// Build a lookup from every image's original filename (as it would appear
// in an Obsidian embed or a markdown link, spaces and all) to its copied,
// URL-safe location under public/preview-images/.
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

// Rewrites both image syntaxes found across chapters:
//   Obsidian embed:      ![[filename.png]]  or  ![[filename.png|1190]]
//   Markdown w/ width hack: ![alt|1190](filename.png)
//   Plain markdown:       ![alt](filename.png)
// into a plain <img> tag pointing at the copied, gitignored preview copy.
function rewriteImages(content, imageMap) {
  const resolve = (originalName) => {
    const hit = imageMap.get(originalName.trim());
    return hit ? `/preview-images/${hit.safeName}` : null;
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
  if (lines[0] && lines[0].trim() === `# ${title}`) {
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

let synced = 0;
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
    `summary: ${yamlString("Private preview draft — not for publication.")}`,
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
  synced += 1;
});

console.log(
  `Synced ${synced} chapter(s) into ${path.relative(ROOT, OUTPUT_DIR)}/ ` +
    `and ${imageMap.size} image(s) into ${path.relative(ROOT, IMAGES_OUT_DIR)}/` +
    (missing ? ` (${missing} chapter file(s) missing)` : "")
);
