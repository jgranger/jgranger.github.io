import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  Chapter,
  ChapterMeta,
  TocPart,
  TocEntry,
  AdjacentChapters,
} from "@/types/content";

function walkMdxFiles(dir: string): string[] {
  // git doesn't track empty directories — with zero chapters published,
  // content/book/ has no files in it and so doesn't exist at all in a
  // fresh checkout (e.g. CI), even though it exists locally once you've
  // ever had content in it. Treat "no directory" the same as "no files"
  // rather than letting readdirSync throw ENOENT.
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
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

function sortChapters(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort((a, b) => {
    if (a.meta.part !== b.meta.part) {
      return a.meta.part.localeCompare(b.meta.part);
    }
    return a.meta.chapterNumber - b.meta.chapterNumber;
  });
}

/**
 * Orders chapters by following the authored previous/next chain (starting
 * from the chapter with no previous), not by part name + per-part
 * chapterNumber. Per-part numbering resets to 1 in every part, so sorting
 * by it produces a reading order that isn't actually sequential once
 * there's more than one part. The previous/next chain is the single
 * source of truth for what order the book is actually meant to be read
 * in, and it already spans every chapter regardless of part.
 *
 * Falls back to the part/number sort for anything unreachable from the
 * chain (a broken link, or no chapter with previous: null) rather than
 * dropping chapters silently.
 */
function buildReadingOrder(chapters: Chapter[]): Chapter[] {
  const bySlug = new Map(chapters.map((c) => [c.meta.slug, c]));
  const head = chapters.find((c) => !c.meta.previous);

  const ordered: Chapter[] = [];
  const seen = new Set<string>();
  let current = head;
  while (current && !seen.has(current.meta.slug)) {
    ordered.push(current);
    seen.add(current.meta.slug);
    current = current.meta.next ? bySlug.get(current.meta.next) : undefined;
  }

  for (const chapter of sortChapters(chapters)) {
    if (!seen.has(chapter.meta.slug)) ordered.push(chapter);
  }

  return ordered;
}

export function getAllChapters(contentDir: string): Chapter[] {
  const files = walkMdxFiles(contentDir);
  const chapters = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      meta: data as ChapterMeta,
      content,
      filePath,
    };
  });
  return sortChapters(chapters);
}

export function getPublishedChapters(contentDir: string): Chapter[] {
  return buildReadingOrder(getAllChapters(contentDir)).filter(
    (chapter) => chapter.meta.status === "published"
  );
}

export function getChapterBySlug(
  contentDir: string,
  slug: string
): Chapter | null {
  const chapter = getAllChapters(contentDir).find(
    (c) => c.meta.slug === slug
  );
  return chapter ?? null;
}

function toTocEntry(chapter: Chapter, displayNumber: number): TocEntry {
  return {
    title: chapter.meta.title,
    slug: chapter.meta.slug,
    part: chapter.meta.part,
    chapterNumber: displayNumber,
    summary: chapter.meta.summary,
    status: chapter.meta.status,
  };
}

/**
 * Display chapter number for every published chapter, keyed by slug —
 * position in the actual reading order (see buildReadingOrder), not the
 * per-part frontmatter chapterNumber, which resets to 1 in every part.
 */
function displayNumbersBySlug(contentDir: string): Map<string, number> {
  const published = getPublishedChapters(contentDir);
  return new Map(published.map((c, index) => [c.meta.slug, index + 1]));
}

export function getTableOfContents(contentDir: string): TocPart[] {
  const published = getPublishedChapters(contentDir);
  const numbers = displayNumbersBySlug(contentDir);
  const partsInOrder: string[] = [];
  const partTitleByKey = new Map<string, string>();
  for (const chapter of published) {
    if (!partsInOrder.includes(chapter.meta.part)) {
      partsInOrder.push(chapter.meta.part);
      partTitleByKey.set(chapter.meta.part, chapter.meta.partTitle);
    }
  }
  return partsInOrder.map((part) => ({
    part,
    partTitle: partTitleByKey.get(part) as string,
    chapters: published
      .filter((c) => c.meta.part === part)
      .map((c) => toTocEntry(c, numbers.get(c.meta.slug)!)),
  }));
}

export function getFlatChapterList(contentDir: string): TocEntry[] {
  return getPublishedChapters(contentDir).map((c, index) =>
    toTocEntry(c, index + 1)
  );
}

/** Display chapter number for a single published chapter, or null if it isn't published. */
export function getChapterDisplayNumber(
  contentDir: string,
  slug: string
): number | null {
  return displayNumbersBySlug(contentDir).get(slug) ?? null;
}

export function getAdjacentChapters(
  contentDir: string,
  slug: string
): AdjacentChapters {
  const chapter = getChapterBySlug(contentDir, slug);
  if (!chapter) {
    return { previous: null, next: null };
  }
  const numbers = displayNumbersBySlug(contentDir);
  const previousChapter = chapter.meta.previous
    ? getChapterBySlug(contentDir, chapter.meta.previous)
    : null;
  const nextChapter = chapter.meta.next
    ? getChapterBySlug(contentDir, chapter.meta.next)
    : null;
  return {
    previous:
      previousChapter && previousChapter.meta.status === "published"
        ? toTocEntry(previousChapter, numbers.get(previousChapter.meta.slug)!)
        : null,
    next:
      nextChapter && nextChapter.meta.status === "published"
        ? toTocEntry(nextChapter, numbers.get(nextChapter.meta.slug)!)
        : null,
  };
}
