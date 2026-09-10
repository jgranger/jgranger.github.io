#!/usr/bin/env node
// Promotes docs/private/chapters/*.md into content/book/book/*.mdx — the
// actual public, committed chapter content. This is the deliberate,
// separate "promote" step described in CLAUDE.md: real chapter drafting
// happens privately, and moving a chapter into the public site is a
// conscious choice, not automatic.
//
// Mirrors scripts/sync-preview-content.mjs's conversion logic (Obsidian
// image embeds, leading-heading stripping, frontmatter shape), but writes
// to the real public, git-tracked locations instead of the gitignored
// preview ones, and includes a real one-line summary per chapter instead
// of leaving it blank.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "docs/private/chapters");
const OUTPUT_DIR = path.join(ROOT, "content/book/book");
const PRIVATE_DIR = path.join(ROOT, "docs/private");
const IMAGES_OUT_DIR = path.join(ROOT, "public/book-images");

// Order matches docs/private/book-vision.md's Chapter Structure. Update
// this list (and the summary) if that structure changes.
const CHAPTERS = [
  {
    file: "01-one-problem-worth-solving.md",
    slug: "one-problem-worth-solving",
    title: "One Problem Worth Solving",
    summary: "We live in a messaging-based world — and the first production agent at momoGood grew out of taking that literally.",
  },
  {
    file: "02-the-ideas-factory.md",
    slug: "the-ideas-factory",
    title: "The Ideas Factory",
    summary: "One working agent turned into a stream of requests for entirely new ones — and then into an acquisition.",
  },
  {
    file: "03-context-engineering.md",
    slug: "context-engineering",
    title: "Context Engineering",
    summary: "More context isn't better context. What it actually took to give an agent the right information instead of everything.",
  },
  {
    file: "04-the-grid-needs-a-guardian.md",
    slug: "the-grid-needs-a-guardian",
    title: "The Grid Needs a Guardian",
    summary: "Meet BitBot — the evaluator that watches the Ask Product agent so it never grades its own homework.",
  },
  {
    file: "05-from-agent-to-platform.md",
    slug: "from-agent-to-platform",
    title: "From Agent to Platform",
    summary: "Getting an agent to work is the easy part. What production readiness actually demands once people depend on it.",
  },
  {
    file: "06-life-in-the-fast-lane.md",
    slug: "life-in-the-fast-lane",
    title: "Life in the Fast Lane",
    summary: "An acquisition doubled the incoming request volume overnight — and Fastlane was built to triage it safely.",
  },
  {
    file: "07-graph-engineering.md",
    slug: "graph-engineering",
    title: "Graph Engineering",
    summary: "Why graph engineering is about discovering relationships at scale, and what it means to step into the agentic universe.",
  },
  {
    file: "08-intelligence-in-the-middle.md",
    slug: "intelligence-in-the-middle",
    title: "Intelligence in the Middle",
    summary: "Once agents reason in the middle of every process, people don't matter less — they matter more.",
  },
  {
    file: "09-the-flywheel.md",
    slug: "the-flywheel",
    title: "The Flywheel",
    summary: "How use becomes data, data becomes feedback, and the system gets smarter without the underlying model ever changing.",
  },
  {
    file: "10-organizational-learning.md",
    slug: "self-replication",
    title: "Self Replication",
    summary: "Encoding your own judgment, instincts and talents into a constellation of specialized agents.",
  },
  {
    file: "11-looking-forward.md",
    slug: "looking-forward",
    title: "Looking Forward",
    summary: "Where this all points next.",
  },
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
    `summary: ${yamlString(chapter.summary)}`,
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
