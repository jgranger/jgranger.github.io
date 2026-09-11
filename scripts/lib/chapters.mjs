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
export const CHAPTERS = [
  { file: "01-one-problem-worth-solving.md", slug: "one-problem-worth-solving", title: "One Problem Worth Solving" },
  { file: "02-the-ideas-factory.md", slug: "the-ideas-factory", title: "The Ideas Factory" },
  { file: "03-context-engineering.md", slug: "context-engineering", title: "Context Engineering" },
  { file: "04-the-grid-needs-a-guardian.md", slug: "the-grid-needs-a-guardian", title: "The Grid Needs a Guardian" },
  { file: "05-from-agent-to-platform.md", slug: "from-agent-to-platform", title: "From Agent to Platform" },
  { file: "06-life-in-the-fast-lane.md", slug: "life-in-the-fast-lane", title: "Life in the Fast Lane" },
  { file: "07-graph-engineering.md", slug: "graph-engineering", title: "Graph Engineering" },
  { file: "08-intelligence-in-the-middle.md", slug: "intelligence-in-the-middle", title: "Intelligence in the Middle" },
  { file: "09-the-flywheel.md", slug: "the-flywheel", title: "The Learning Flywheel" },
  { file: "10-organizational-learning.md", slug: "the-organization-is-the-operating-system", title: "The Organization Is the Operating System" },
  { file: "11-looking-forward.md", slug: "looking-forward", title: "Looking Forward" },
];

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
