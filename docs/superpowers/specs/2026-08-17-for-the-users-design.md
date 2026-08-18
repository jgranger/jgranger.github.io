# "For the Users" Bonus Chapter, Reveal, and Golf Mini-Game

## Problem

The current Konami-code bonus chapter is named "End of Line" — a real
Tron phrase, but the wrong one: it's Sark's execution phrase, used by
the MCP to delete programs who won't submit. It represents tyranny, not
the freedom/agency the book is actually about. Rename it, and build a
reveal and follow-on interaction worthy of "epic" — a red-to-blue
transition evoking the MCP's fall, followed by a mini-game (a blend of
the site's own look and Zany Golf's slingshot-golf mechanic) that
unlocks a second, deeper hidden chapter.

## Scope

- Rename the existing bonus chapter and its route.
- Add a CSS-driven reveal animation on load.
- Add an end-of-chapter gate offering a mini-game.
- Build the mini-game (mouse + touch).
- Add a second unlockable bonus chapter, gated on winning the game.

Out of scope: the actual prose content of either bonus chapter (both
stay placeholders until Jon writes them, per the established pattern);
any change to the main Konami-code entry sequence itself.

## Design

### 1. Rename: End of Line → For the Users

- `app/end-of-line/` → `app/for-the-users/` (route + page component).
- `content/bonus/end-of-line.mdx` → `content/bonus/for-the-users.mdx`.
- `components/KonamiListener.tsx`: `router.push` target becomes
  `/for-the-users/`.
- `components/publication/ChapterSidebar.tsx`: bonus entry text becomes
  "12. For the Users", link becomes `/for-the-users/`. The existing
  `sessionStorage` key (`konami-unlocked`) is unchanged — only the
  route/label move.

### 2. The reveal (red → blue)

A new client component wraps the chapter content and plays once on
load, ~2.5s total:

1. Full-screen red-hued grid — the existing `hero-grid.png` re-colored
   via CSS `filter: hue-rotate(...) saturate(...)` (no new image asset),
   with 2-3 quick brightness flicker pulses.
2. A single fast flash-to-white keyframe (the "break").
3. Hue animates from red back to the site's real cyan over ~1s, with a
   brightness/scale overshoot right at the color-turn for a punchy,
   slightly cartoonish beat rather than a limp fade — this is the
   "Zany Golf energy" moment.
4. "For the Users" fades/types in over the now-blue grid, holds
   briefly, then the page settles into the normal chapter layout
   (sidebar + prose).

`prefers-reduced-motion: reduce` skips straight to the settled end
state (blue grid, title visible, no animation). Plays once per page
load — reloading replays it, matching the "reveal is part of the
moment" feel rather than needing separate first-visit tracking.

### 3. End-of-chapter gate

After the chapter's prose content, a section reads roughly: "There's
one more chapter. You have to earn it." with a "Play" control that
reveals the mini-game inline, further down the same page — not a
separate route.

### 4. The mini-game — slingshot golf

New client component, `components/bonus/GolfGame.tsx`, canvas-based.

**Look:** hand-coded canvas shapes couldn't reach the visual quality an
illustrated scene needs, so the course background is a real image
(`public/golf-course-default.jpg`) — an original isometric "energy level" scene
Jon generated himself (inspired by Zany Golf's mood, not a reproduction
of it, and distinct enough to avoid any copyright concern), including a
turret that fires a beam across the course. Tee, hole, and the beam's
path are calibrated pixel positions against that specific image
(verified by rendering markers onto it before committing). Physics
still simulate in plain flat 2D canvas coordinates matching the image's
pixel space directly — no isometric transform math needed once the art
itself already encodes the perspective. Canvas-drawn overlays (ball,
aim line, the hole's blinking eyes, the flag) redraw each frame on top
of the static background so they can move and animate; the beam itself
is baked into the artwork and always faintly visible, with an
additional bright pulse animated along its path periodically.

**Input:** the Pointer Events API (`pointerdown`/`pointermove`/
`pointerup`) unifies mouse and touch in one code path — no separate
handlers needed for each. Pointer-down on the ball starts a drag; a
dotted aim/pull-back line renders live while dragging, updating with
the drag vector; pointer-up launches the ball with velocity
proportional to, and opposite, the pull vector (slingshot control,
matching "grab, pull back, release").

**Physics:** hand-rolled 2D kinematics via `requestAnimationFrame` —
`position += velocity` each frame, velocity decays by a constant
friction factor, and the ball bounces off course-boundary walls with a
damping factor on impact. No physics library — this is simple enough
to hand-roll and keeps the site dependency-free, consistent with every
other atmosphere effect on the site so far.

**Sink logic:** the hole has a capture radius, and — matching the Zany
Golf mouse-hole reference — its eyes are white by default and pulse red
on a fixed cycle. The ball sinks only if it arrives within the capture
radius *while the eyes are red* and *below* a max-sink speed; arriving
too fast, or while the eyes are white, bounces the ball off the rim
instead of sinking. So landing the shot requires aim, power, and timing
together, not just proximity.

**Miss handling:** once the ball's speed decays near zero without
sinking, it auto-resets to the tee after a brief pause. Infinite
retries, no counter, no penalty — low-stakes by design.

**Win state:** the flag pin above the hole sinks down together with the
ball, both fading out in sync (matching the actual Zany Golf win
animation), then a "Continue to Full Access" link appears.

### 5. Unlocking "Full Access"

Winning sets a new `sessionStorage` key (`game-unlocked`), parallel to
the existing `konami-unlocked` pattern. This does two things:

- Reveals the "Continue to Full Access" link on the `for-the-users`
  page itself.
- Adds a "13. Full Access" entry to `ChapterSidebar` for the rest of
  the session — same persistence behavior as the existing Konami
  reveal (survives reload, clears on next visit/new session).

`app/full-access/page.tsx` is a new standalone route, following the
exact pattern of the current `end-of-line/page.tsx`: reads its own MDX
file (`content/bonus/full-access.mdx`, placeholder content) directly,
is not part of `generateStaticParams`/the published chapter list, and
is unreachable except via the "Continue" link after winning (or by
guessing the URL — same trust model as the existing bonus chapter).

### Testing

- `npm run build` — confirm both bonus routes exist as standalone pages
  outside `generateStaticParams`, no regressions elsewhere.
- Manual play-through: trigger the Konami code, watch the full reveal
  sequence, play the mini-game with both a mouse and a touch-capable
  device/emulator, confirm sinking reveals the "Continue" link and adds
  "Full Access" to the sidebar, confirm a miss auto-resets the ball,
  confirm a fresh session (cleared `sessionStorage`) hides both bonus
  entries again.
- Confirm `prefers-reduced-motion` skips the reveal animation cleanly.
