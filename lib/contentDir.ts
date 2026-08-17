import path from "node:path";

// Local-preview-only override. When PREVIEW_CONTENT_DIR is set (e.g. via
// `npm run preview`), the site reads chapters from that directory instead
// of the committed content/book/. That directory is gitignored — it never
// gets tracked, so there's no way for private content to end up staged in
// a commit to this public repo.
export const CONTENT_DIR = path.join(
  process.cwd(),
  process.env.PREVIEW_CONTENT_DIR || "content/book"
);
