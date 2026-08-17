# Tron Dark Theme — Design Spec

Supersedes the visual/theme portions of the original site design spec
(`2026-07-24-agentic-journey-website-design.md`). Structural/architectural
decisions in that doc (static export, App Router, no momoStyle dependency,
etc.) are unaffected.

## Why

Jon shared a Tron-styled slide from an internal engineering presentation
and wants the whole site restyled around it. This is his personal book,
not a momoGood-branded property, so the existing momoGood brand palette
(coral/crimson/night-sky/periwinkle/parchment) is retired entirely.

## Scope decisions (confirmed with Jon)

- **Dark only, no light/dark toggle.** The current `.dark` CSS class is
  unused dead code (nothing in the app ever applies it) — this is a net
  simplification, not a regression. The dark Tron palette becomes the
  site's only look, defined directly on `:root`.
- **Full palette replacement.** No momoGood brand colors survive as
  secondary accents.
- **No themed/sci-fi display font.** Jon was explicit: "I don't want
  Tron font... the theme is mainly the background and style." Typography
  is a genuine improvement over the current Outfit/Work Sans pairing
  (which Jon called "awful"), not a thematic one.
- **Highly readable, screenshot-heavy.** The book will embed many
  screenshots — the design must support that (a real border/glow frame
  treatment for images, not raw `<img>` tags on a dark background) and
  prioritize long-form reading comfort over visual flourish.
- **Atmosphere is placed deliberately, not everywhere.** The perspective
  grid floor and stronger glow effects are reserved for the homepage
  hero and chapter-opening headers. The actual body of a chapter (where
  someone is reading paragraphs) stays calm: dark background + accent
  colors, no competing line-work behind text.

## Visual design (validated with Jon via mockups)

### Color

```
--background:            #05070D   /* near-black, cool blue bias */
--background-elevated:   #0B1220   /* cards, panels */
--foreground:             #E8EEF5  /* primary text */
--foreground-secondary:   #C7D2DE  /* body copy */
--foreground-subtle:      #8A9BB0  /* eyebrows, captions, metadata */
--border:                 rgba(34, 211, 238, 0.25)   /* default card/rule border, cyan */
--accent-cyan:             #22D3EE  /* primary accent — links, primary buttons, active states */
--accent-violet:           #A78BFA  /* secondary accent */
--accent-magenta:          #EC4899  /* tertiary accent, used sparingly */
```

Card borders rotate through the three accents (cyan → violet → magenta)
as a visual rhythm across a list (e.g. the table of contents) — this is
decorative variety, not a semantic color code (i.e. "magenta doesn't
mean anything specific").

Screenshots/figures get the same card treatment as text cards: a thin
accent-colored border (`rgba` at low opacity) plus a soft matching glow
(`box-shadow` with the same hue at very low opacity), on the elevated
background color — not a bare image dropped directly on the page
background.

### Typography

Confirmed direction: **serif headings + sans body** (mockup "Option A").

- Headings: **Fraunces** (variable, self-hosted via a new
  `@fontsource-variable/fraunces` dependency, matching how the current
  fonts are already self-hosted — no CDN).
  - Fraunces was used in the mockup comparison; if Jon wants a different
    specific serif at implementation time that's a copy-in swap, not a
    design change (the design is "serif display + sans body," not
    married to this exact family) — but ship Fraunces unless told
    otherwise, since it's what was approved.
- Body: **Public Sans** (variable, self-hosted via a new
  `@fontsource-variable/public-sans` dependency).
- Both replace Outfit and Work Sans respectively across the whole type
  scale already defined in `styles/globals.css` (`--text-h1` through
  `--text-eyebrow`) — the scale/sizing itself is not changing, only the
  font-family tokens (`--font-heading`, `--font-sans`).

### Components

- **Header nav**: unchanged structure (logo left, Contents/About right),
  restyled with a bottom border in the low-opacity cyan rule color, wordmark
  in the heading font.
- **Table of Contents cards**: each chapter gets a bordered card
  (`background-elevated`, rotating accent border + matching soft glow),
  title in the heading font, summary in muted secondary text.
- **Buttons**: primary = solid cyan fill with near-black text (high
  contrast, matches the slide's bright accent-on-dark treatment);
  secondary = transparent with a subtle light border.
- **Screenshots/figures**: bordered + glowing frame as described above,
  applied via a shared component/utility class rather than repeated
  inline styles per image.

## Out of scope for this pass

- The perspective grid-floor graphic itself (hero/chapter-header
  treatment) — this spec establishes where it's allowed to appear, not
  its exact implementation (SVG vs. CSS vs. image asset). Follow-up
  work, not blocking the base theme rollout.
- Per-chapter content changes — this is a visual/styling pass only.
