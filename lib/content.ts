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
  return getAllChapters(contentDir).filter(
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

function toTocEntry(chapter: Chapter): TocEntry {
  return {
    title: chapter.meta.title,
    slug: chapter.meta.slug,
    part: chapter.meta.part,
    chapterNumber: chapter.meta.chapterNumber,
    summary: chapter.meta.summary,
    status: chapter.meta.status,
  };
}

export function getTableOfContents(contentDir: string): TocPart[] {
  const published = getPublishedChapters(contentDir);
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
      .map(toTocEntry),
  }));
}

export function getAdjacentChapters(
  contentDir: string,
  slug: string
): AdjacentChapters {
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
