# Reading Layout Redesign

## Problem

The chapter/article reading experience wastes horizontal space and uses body
text that's too small for sustained reading. On a normal or wide desktop
window, the content column stops growing at a fixed pixel width and the rest
of the viewport sits empty as margin. Body copy tops out at 16px, closer to
UI-label size than book-copy size.

Target feel: Kindle-like — the reading surface fills the available space with
larger, comfortable type and minimal unused whitespace, not a narrow column
floating in a sea of margin. Must remain responsive across mobile, tablet,
and desktop, and must stay a single column (no open-book/two-column layout).

## Changes

### 1. Fluid column width (replaces fixed rem caps)

`styles/globals.css` currently defines:

```css
--width-reading: 52rem;
--width-wide: 72rem;
```

These are fixed values — past a given window size the column stops growing
and remaining width becomes dead margin. Replace with fluid, viewport-based
values:

```css
--width-reading: min(92vw, 76rem);
--width-wide: min(94vw, 84rem);
```

`min(92vw, ...)` scales continuously with the viewport instead of jumping to
a hard ceiling, so a maximized desktop window keeps gaining reading width.
The `92vw`/`94vw` floor keeps sensible edge padding on mobile without a
separate breakpoint rule.

### 2. Larger, taller body type

Current `--text-p1` (drives prose body copy):

```css
--text-p1: clamp(0.875rem, 0.83rem + 0.19vw, 1rem);
--text-p1--line-height: clamp(1.25rem, 1.16rem + 0.38vw, 1.5rem);
```

Raise the baseline and let it scale further on wide viewports, with taller
line-height for long-form reading comfort (closer to Kindle's default
line-height ratio, ~1.7–1.8):

```css
--text-p1: clamp(1.125rem, 1.02rem + 0.5vw, 1.375rem);
--text-p1--line-height: clamp(1.9rem, 1.7rem + 0.85vw, 2.35rem);
```

`--text-lead` (used for chapter summaries/intros) should scale up
proportionally so it stays visibly larger than body copy; exact values
tuned during implementation, same clamp shape.

### 3. Remove Tailwind Typography's competing `max-width`

`@tailwindcss/typography`'s `.prose` class ships its own built-in
`max-width: 65ch` on the element, independent of the `max-w-(--width-reading)`
already applied to the parent `<main>` in `app/book/[part]/[chapter]/page.tsx`
and `app/end-of-line/page.tsx`. This is a likely reason the earlier
width-token widening had less visible effect than expected — `.prose` may
have been the actual binding constraint, not the parent container.

Fix: add `prose:max-w-none` (or equivalent `[&.prose]:max-w-none` override)
wherever `className="prose prose-invert"` is used, so the parent `<main>`'s
fluid width from #1 is what governs line length, with no second competing
cap layered on top.

### 4. Padding

Reduce horizontal padding on the reading `<main>` (currently `px-4`)
modestly — enough to avoid removing the gutter mobile still needs, but not
so much that it fights the width gains from #1. Exact value tuned during
implementation/visual check rather than fixed here.

## Out of scope

- Any layout other than single-column (no two-column/open-book treatment).
- Table of Contents card layout/typography — this spec covers the
  chapter/article reading surface (`app/book/[part]/[chapter]/page.tsx`,
  `app/end-of-line/page.tsx`) and the shared width/type tokens in
  `styles/globals.css`.
- Header/nav sizing beyond widening `--width-wide` itself.

## Testing

- Visual check at common breakpoints (mobile ~375px, tablet ~768px, laptop
  ~1440px, wide desktop ~1920px+) confirming the column visibly grows with
  the viewport instead of plateauing, and that line length stays readable
  (not so wide it becomes hard to track lines) at the largest sizes.
- Confirm `.prose` no longer self-limits width independent of the parent
  container (inspect computed width in devtools).
- `npm run build` to confirm no regressions.
