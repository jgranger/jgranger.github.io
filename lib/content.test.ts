import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  getAllChapters,
  getPublishedChapters,
  getChapterBySlug,
  getTableOfContents,
  getAdjacentChapters,
} from "./content";

const FIXTURE_DIR = path.join(__dirname, "__fixtures__/content/book");

describe("getAllChapters", () => {
  it("returns all chapters including drafts, sorted by part then chapter number", () => {
    const chapters = getAllChapters(FIXTURE_DIR);
    expect(chapters.map((c) => c.meta.slug)).toEqual([
      "first-chapter",
      "second-chapter",
      "third-chapter",
    ]);
  });
});

describe("getPublishedChapters", () => {
  it("excludes draft chapters", () => {
    const chapters = getPublishedChapters(FIXTURE_DIR);
    expect(chapters.map((c) => c.meta.slug)).toEqual([
      "first-chapter",
      "third-chapter",
    ]);
  });
});

describe("getChapterBySlug", () => {
  it("returns the matching chapter", () => {
    const chapter = getChapterBySlug(FIXTURE_DIR, "second-chapter");
    expect(chapter?.meta.title).toBe("Second Chapter");
    expect(chapter?.content).toContain("Draft content");
  });

  it("returns null for an unknown slug", () => {
    expect(getChapterBySlug(FIXTURE_DIR, "does-not-exist")).toBeNull();
  });
});

describe("getTableOfContents", () => {
  it("groups published chapters by part, excluding drafts", () => {
    const toc = getTableOfContents(FIXTURE_DIR);
    expect(toc).toEqual([
      {
        part: "part-a",
        partTitle: "Part A",
        chapters: [
          {
            title: "First Chapter",
            slug: "first-chapter",
            part: "part-a",
            chapterNumber: 1,
            summary: "The first chapter summary.",
            status: "published",
          },
        ],
      },
      {
        part: "part-b",
        partTitle: "Part B",
        chapters: [
          {
            title: "Third Chapter",
            slug: "third-chapter",
            part: "part-b",
            chapterNumber: 1,
            summary: "The third chapter summary.",
            status: "published",
          },
        ],
      },
    ]);
  });
});

describe("getAdjacentChapters", () => {
  it("resolves previous and next by slug, ignoring draft status", () => {
    const adjacent = getAdjacentChapters(FIXTURE_DIR, "third-chapter");
    expect(adjacent.previous?.slug).toBe("second-chapter");
    expect(adjacent.next).toBeNull();
  });

  it("returns null previous for the first chapter", () => {
    const adjacent = getAdjacentChapters(FIXTURE_DIR, "first-chapter");
    expect(adjacent.previous).toBeNull();
    expect(adjacent.next?.slug).toBe("second-chapter");
  });
});
