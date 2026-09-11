import path from "node:path";

// Local-preview-only override. When PREVIEW_CONTENT_DIR is set (e.g. via
// `npm run preview`), the site reads chapters from that directory instead
// of the committed content/book/. That directory is gitignored — it never
// gets tracked, so there's no way for private content to end up staged in
// a commit to this public repo.
// PREVIEW_CONTENT_DIR points at content/book-preview, which — like the
// public content/ dir — has book/ and bonus/ as sibling subdirectories.
// Chapter listing must walk only the book/ subtree, not the parent,
// otherwise it recurses into bonus/ too and finds a page whose
// frontmatter has no part/chapterNumber/slug, crashing chapter sorting.
export const CONTENT_DIR = path.join(
  process.cwd(),
  process.env.PREVIEW_CONTENT_DIR
    ? path.join(process.env.PREVIEW_CONTENT_DIR, "book")
    : "content/book"
);

// Same override, same gitignore guarantee, for the bonus (Konami-code)
// pages. Falls back to the committed public placeholder otherwise.
export const BONUS_DIR = path.join(
  process.cwd(),
  process.env.PREVIEW_CONTENT_DIR ? "content/book-preview/bonus" : "content/bonus"
);
