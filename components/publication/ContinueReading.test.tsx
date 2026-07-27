import { describe, it, expect, beforeEach } from "vitest";
import { recordChapterVisit, getLastVisitedChapter } from "./ContinueReading";

describe("recordChapterVisit / getLastVisitedChapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing has been recorded", () => {
    expect(getLastVisitedChapter()).toBeNull();
  });

  it("returns the most recently recorded chapter", () => {
    recordChapterVisit({ title: "First", part: "foundations", slug: "first" });
    recordChapterVisit({ title: "Second", part: "foundations", slug: "second" });
    expect(getLastVisitedChapter()).toEqual({
      title: "Second",
      part: "foundations",
      slug: "second",
    });
  });
});
