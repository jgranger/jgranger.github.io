# Chapter Sidebar Navigation

## Problem

Chapter reading pages only offer prev/next links and a "return to Table of
Contents" link at the bottom — there's no way to jump directly to any other
chapter while reading. Add a persistent left-hand navigation pane, outside
the content column, listing all chapters.

## Scope

Chapter reading pages only (`app/book/[part]/[chapter]/page.tsx`). Not shown
on Home, Table of Contents, About, or the hidden `/end-of-line/` page.

## Design

### Data

`getPublishedChapters(CONTENT_DIR)` (already used for `generateStaticParams`)
provides the flat chapter list: `{ slug, part, title, chapterNumber }`. No
new data layer — the chapter page passes this list plus the current slug
into the sidebar component.

### Component: `components/publication/ChapterSidebar.tsx` (new, client)

A single client component (chosen over splitting into multiple smaller
pieces — the list is a handful of items, so there's no meaningful cost to
keeping it as one client-rendered island):

- Renders the flat chapter list (no Part grouping — matches the existing
  flat-list convention used elsewhere for chapter listings) as links to
  `/book/{part}/{slug}/`.
- Highlights whichever entry matches the current chapter's slug (accent
  color/border) via a `currentSlug` prop.
- On mount, checks `sessionStorage.getItem("konami-unlocked")`. If present,
  appends a link to `/end-of-line/` at the bottom of the list, styled
  distinctly (dim/understated) rather than as a normal numbered chapter —
  it's a found secret, not a regular nav item.
- Owns a mobile open/closed state (`useState`). Below the `lg:` breakpoint,
  a toggle button (fixed near the top of the content) shows/hides the
  sidebar as an overlay; at `lg:` and above the sidebar is always visible
  inline and the toggle is hidden.

### Reveal persistence

`components/KonamiListener.tsx` sets
`sessionStorage.setItem("konami-unlocked", "true")` at the moment the
sequence matches, alongside the existing `router.push("/end-of-line/")`.
`sessionStorage` persists across reloads/hard-refreshes within the same
browser tab/session and clears when the tab or browser closes — matching
"visible for the rest of this visit, hidden again on the next visit."

### Layout

The chapter page's `<main>` is currently a single centered column
(`max-w-(--width-reading) mx-auto`). It becomes a two-column flex layout:
a fixed-width sticky sidebar (stays in view while scrolling a long chapter)
alongside the content column, which keeps its own fluid max-width from the
recent reading-layout work so adding a sidebar doesn't blow out line length.
The outer wrapper widens to accommodate both columns.

### Testing

- `npm run build` — no regressions, `/end-of-line` still absent from
  `generateStaticParams`/any nav.
- Desktop: sidebar and content both visible, current chapter highlighted,
  content column still comfortably readable.
- Mobile: sidebar hidden by default, toggle opens/closes it.
- Konami reveal: trigger the code, confirm the bonus entry appears in the
  sidebar; hard-refresh a chapter page and confirm it's still visible;
  simulate a fresh session (clear `sessionStorage`) and confirm it's hidden
  again.
