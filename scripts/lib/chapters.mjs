import fs from "node:fs";
import path from "node:path";

// The single source of truth for chapter file → slug → title mapping,
// shared by scripts/sync-preview-content.mjs (local preview) and
// scripts/promote-chapters.mjs (Render build). These two scripts used to
// each keep their own independent copy of this list, and it drifted out
// of sync more than once — a chapter's title or slug got updated in one
// script but not the other, so preview mode and the real promoted site
// silently disagreed about what URL a chapter lived at (a real 404 this
// caused: chapter 6 was "life-in-the-fast-lane" in one script and
// "fastlane" in the other). One shared list makes that class of bug
// structurally impossible instead of something to remember to keep in
// sync by hand.
//
// Order matches docs/private/book-vision.md's current Chapter Structure
// exactly. Update this list if that order, a title, or a slug ever
// changes — this is the only place it needs to change.
//
// Chapters are found by their number prefix ("10-…md"), not by full
// filename, so renaming a chapter file in Obsidian doesn't silently drop it
// from the site. URLs come from `slug` here, never from the filename.
export const CHAPTERS = [
  { number: "01", slug: "one-problem-worth-solving", title: "One Problem Worth Solving" },
  { number: "02", slug: "the-ideas-factory", title: "The Ideas Factory" },
  { number: "03", slug: "context-engineering", title: "Context Engineering" },
  { number: "04", slug: "the-grid-needs-a-guardian", title: "The Grid Needs a Guardian" },
  { number: "05", slug: "from-agent-to-platform", title: "From Agent to Platform" },
  { number: "06", slug: "life-in-the-fast-lane", title: "Life in the Fast Lane" },
  { number: "07", slug: "graph-engineering", title: "Graph Engineering" },
  { number: "08", slug: "from-connection-to-action", title: "From Connection to Action" },
  { number: "09", slug: "intelligence-in-the-middle", title: "Intelligence in the Middle" },
  { number: "10", slug: "the-flywheel", title: "The Learning Flywheel" },
  { number: "11", slug: "the-organization-is-the-operating-system", title: "The Organization Is the Operating System" },
  { number: "12", slug: "what-deserves-attention", title: "What Deserves Attention" },
];

// Resolves a chapter to its source file by number prefix. Returns null when
// no file matches; throws when two do, since guessing would publish the
// wrong draft.
export function chapterSourcePath(dir, chapter) {
  const matches = fs.readdirSync(dir).filter((name) => name.startsWith(`${chapter.number}-`) && name.endsWith(".md"));
  if (matches.length > 1) throw new Error(`Chapter ${chapter.number} matches several files: ${matches.join(", ")}`);
  return matches.length ? path.join(dir, matches[0]) : null;
}

// Bonus (Konami-code) pages. Each maps one private draft file to the slug
// its page component reads (see app/for-the-users/page.tsx and friends).
// The page title stays fixed regardless of the draft's own heading — the
// page's identity is "For the Users"; the draft's heading is just the
// current bonus chapter's title within it. Only used by
// sync-preview-content.mjs today (Render's promote step doesn't touch
// bonus content), but lives here too so it never has to be duplicated
// if that changes.
export const BONUS_PAGES = [
  { file: "the-multiplier.md", slug: "for-the-users", title: "For the Users" },
];
