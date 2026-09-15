/**
 * The single place a chapter's URL is constructed.
 *
 * Chapter URLs used to be /book/<part>/<slug>, from when the book had a
 * real multi-part structure. That structure was dropped — every content
 * chapter now carries the literal part "book", which produced the
 * nonsense /book/book/<slug>. The part segment is gone from content
 * chapter URLs; `part` still exists in the data model because the
 * table-of-contents grouping and the Citation Graph both rely on it.
 *
 * The Citation Graph is the one non-content "chapter" (part:
 * "references"). It isn't a promoted MDX file and has its own static
 * route at /book/references/citation-graph, so it keeps a part segment.
 */
export function chapterHref({ part, slug }: { part: string; slug: string }): string {
  if (part === "references") {
    return `/book/references/${slug}/`;
  }
  return `/book/${slug}/`;
}
