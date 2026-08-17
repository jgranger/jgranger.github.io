# Homepage Hero Grid Floor

## Problem

The Tron theme spec deliberately deferred a perspective grid floor as
"out of scope for this pass." Jon shared a reference slide (cyan grid
floor converging toward the horizon, a HUD-style diagram with a
blue-to-purple gradient, and a faceted "BitBot" icosahedron icon) and
wants the grid and the blue-to-purple gradient transition brought into
the site now. The icon is explicitly deferred (no image-generation tool
available in this environment; Jon may supply a clean asset later).

## Scope

Homepage hero section only (`app/page.tsx`), not the site nav header, not
chapter headers/pages.

## Design

### Structure

The hero `<section>` gets `position: relative; overflow: hidden`. Two
decorative layers render behind the real content as CSS pseudo-elements:
`::before` for the gradient wash, `::after` for the grid floor. The real
content (heading, subtitle, Start Reading button, ContinueReading) is
wrapped so it stacks above via `position: relative; z-index: 1`.

### Gradient

A diagonal wash using the existing `--accent-cyan` → `--accent-violet`
tokens (no new colors introduced) at low opacity (~12-15%), so it reads
as atmosphere rather than competing with the heading/body text — matching
the "highly readable" mandate from the reading-layout redesign.

### Grid floor

Repeating-linear-gradient lines in both directions, tilted with
`transform: perspective(...) rotateX(...)` to create the converging-toward-
horizon effect from the reference image. Positioned toward the bottom of
the hero, faded out near the top edge via a mask gradient so it thins out
rather than reading as a flat slab of lines competing with the headline.

### Click-safety

Both decorative pseudo-elements get `pointer-events: none` explicitly, in
addition to the z-index stacking that already puts real content above
them. This is deliberate defense-in-depth: a link-click bug is separately
under investigation, and this new decorative layer must not become a
second source of that problem.

## Out of scope

- The BitBot icosahedron icon (no asset yet, no image-generation tool
  available here).
- Any grid/gradient treatment on chapter headers, the site nav, or any
  page besides the homepage hero.

## Testing

- `npm run build` — no regressions.
- Visual check: grid/gradient render behind the hero content without
  obscuring the heading or subtitle text.
- Confirm the Start Reading button and other hero links remain fully
  clickable across their whole visual area (directly relevant given the
  open click-bug report).
