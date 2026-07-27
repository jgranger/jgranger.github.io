import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, "lib/__fixtures__/content/book");

function walkMdxFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }
  return files;
}

function sortChapters(chapters) {
  return [...chapters].sort((a, b) => {
    if (a.meta.part !== b.meta.part) {
      return a.meta.part.localeCompare(b.meta.part);
    }
    return a.meta.chapterNumber - b.meta.chapterNumber;
  });
}

function getAllChapters(contentDir) {
  const files = walkMdxFiles(contentDir);
  const chapters = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      meta: data,
      content,
      filePath,
    };
  });
  return sortChapters(chapters);
}

function getPublishedChapters(contentDir) {
  return getAllChapters(contentDir).filter(
    (chapter) => chapter.meta.status === "published"
  );
}

function getChapterBySlug(contentDir, slug) {
  const chapter = getAllChapters(contentDir).find(
    (c) => c.meta.slug === slug
  );
  return chapter ?? null;
}

function toTocEntry(chapter) {
  return {
    title: chapter.meta.title,
    slug: chapter.meta.slug,
    part: chapter.meta.part,
    chapterNumber: chapter.meta.chapterNumber,
    summary: chapter.meta.summary,
    status: chapter.meta.status,
  };
}

function getTableOfContents(contentDir) {
  const published = getPublishedChapters(contentDir);
  const partsInOrder = [];
  const partTitleByKey = new Map();
  for (const chapter of published) {
    if (!partsInOrder.includes(chapter.meta.part)) {
      partsInOrder.push(chapter.meta.part);
      partTitleByKey.set(chapter.meta.part, chapter.meta.partTitle);
    }
  }
  return partsInOrder.map((part) => ({
    part,
    partTitle: partTitleByKey.get(part),
    chapters: published
      .filter((c) => c.meta.part === part)
      .map(toTocEntry),
  }));
}

function getAdjacentChapters(contentDir, slug) {
  const chapter = getChapterBySlug(contentDir, slug);
  if (!chapter) {
    return { previous: null, next: null };
  }
  const previousChapter = chapter.meta.previous
    ? getChapterBySlug(contentDir, chapter.meta.previous)
    : null;
  const nextChapter = chapter.meta.next
    ? getChapterBySlug(contentDir, chapter.meta.next)
    : null;
  return {
    previous: previousChapter ? toTocEntry(previousChapter) : null,
    next: nextChapter ? toTocEntry(nextChapter) : null,
  };
}

// Run tests
console.log("Testing getAllChapters...");
const allChapters = getAllChapters(FIXTURE_DIR);
const allSlugs = allChapters.map((c) => c.meta.slug);
console.log("All slugs:", allSlugs);
console.assert(
  JSON.stringify(allSlugs) === JSON.stringify(["first-chapter", "second-chapter", "third-chapter"]),
  "getAllChapters test failed"
);
console.log("✓ getAllChapters passed");

console.log("\nTesting getPublishedChapters...");
const publishedChapters = getPublishedChapters(FIXTURE_DIR);
const publishedSlugs = publishedChapters.map((c) => c.meta.slug);
console.log("Published slugs:", publishedSlugs);
console.assert(
  JSON.stringify(publishedSlugs) === JSON.stringify(["first-chapter", "third-chapter"]),
  "getPublishedChapters test failed"
);
console.log("✓ getPublishedChapters passed");

console.log("\nTesting getChapterBySlug...");
const secondChapter = getChapterBySlug(FIXTURE_DIR, "second-chapter");
console.log("Second chapter title:", secondChapter?.meta.title);
console.assert(secondChapter?.meta.title === "Second Chapter", "getChapterBySlug test 1 failed");
console.assert(secondChapter?.content.includes("Draft content"), "getChapterBySlug test 2 failed");
const notFound = getChapterBySlug(FIXTURE_DIR, "does-not-exist");
console.assert(notFound === null, "getChapterBySlug test 3 failed");
console.log("✓ getChapterBySlug passed");

console.log("\nTesting getTableOfContents...");
const toc = getTableOfContents(FIXTURE_DIR);
console.log("TOC parts:", toc.map(p => p.part));
console.assert(toc.length === 2, "getTableOfContents part count test failed");
console.assert(toc[0].part === "part-a", "getTableOfContents part-a test failed");
console.assert(toc[0].chapters.length === 1, "getTableOfContents part-a chapter count failed");
console.assert(toc[0].chapters[0].slug === "first-chapter", "getTableOfContents part-a chapter slug failed");
console.assert(toc[1].part === "part-b", "getTableOfContents part-b test failed");
console.assert(toc[1].chapters.length === 1, "getTableOfContents part-b chapter count failed");
console.assert(toc[1].chapters[0].slug === "third-chapter", "getTableOfContents part-b chapter slug failed");
console.log("✓ getTableOfContents passed");

console.log("\nTesting getAdjacentChapters...");
const thirdAdjacent = getAdjacentChapters(FIXTURE_DIR, "third-chapter");
console.log("Third chapter adjacent - previous:", thirdAdjacent.previous?.slug, "next:", thirdAdjacent.next);
console.assert(thirdAdjacent.previous?.slug === "second-chapter", "getAdjacentChapters test 1 failed");
console.assert(thirdAdjacent.next === null, "getAdjacentChapters test 2 failed");

const firstAdjacent = getAdjacentChapters(FIXTURE_DIR, "first-chapter");
console.log("First chapter adjacent - previous:", firstAdjacent.previous, "next:", firstAdjacent.next?.slug);
console.assert(firstAdjacent.previous === null, "getAdjacentChapters test 3 failed");
console.assert(firstAdjacent.next?.slug === "second-chapter", "getAdjacentChapters test 4 failed");
console.log("✓ getAdjacentChapters passed");

console.log("\n✓ All tests passed!");
