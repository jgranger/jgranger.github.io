# Agentic Journey — Interactive Book Website Design

## Summary

A custom-built interactive publication website for an ongoing personal
writing project about the evolution of momoGood's agentic development
platform. Structured as a book (parts and chapters) but each chapter can
mix narrative text with images, video, Mermaid diagrams, data-driven
animated system flows, code examples, and expandable technical detail.

File-based content, no CMS, no database, no auth. Deployed as a fully
static site to GitHub Pages at the root of `jgranger.github.io`.

This design adapts an initial spec the author drafted with ChatGPT. It is
the authoritative version going forward — where it differs from that
draft, this document wins.

## Repository & Hosting

- Local path: `~/Documents/projects/personal/agentic-journey/`
- Remote: `git@github.com:jgranger/jgranger.github.io.git` (public, renamed
  from `agentic-journey` specifically so it can serve as the GitHub Pages
  **root** user site — a user/org root Pages site must live in a repo
  named exactly `<username>.github.io`)
- Hosting: GitHub Pages, served at `jgranger.github.io` (no basePath —
  it's the root site, not a project page)
- Package manager: npm

### Static export constraints (binding for the whole build)

Next.js App Router with `output: 'export'`. This is a hard constraint,
not a suggestion — anything added later must keep working under static
export:

- No API routes, server actions, middleware, or on-demand ISR.
- `next/image` optimization is unavailable — set
  `images: { unoptimized: true }`.
- `trailingSlash: true`, so nested dynamic routes
  (`/book/[part]/[chapter]/`) resolve reliably as static files.
- All dynamic routes (`/book/[part]/[chapter]`, `/appendix/[slug]`) use
  `generateStaticParams`, enumerating every chapter/appendix known at
  build time from the content directory.
- Every interactive feature (MDX rendering, Mermaid, Motion animations,
  the animated flow player, expandable technical details, reading
  progress, video playback, "continue reading" via `localStorage`) is
  client-side JS. None of it needs a server, so none of it is at risk
  under static export.

### Deployment mechanics

GitHub Pages runs Jekyll by default, which ignores underscore-prefixed
directories — this would silently drop `_next/*` (all built JS/CSS) and
serve an unstyled, broken site. Deploy via a GitHub Actions workflow using
the official `actions/upload-pages-artifact` + `actions/deploy-pages`
actions, which bypass Jekyll entirely (rather than pointing Pages at a
branch with a `.nojekyll` file). The workflow: checkout → `npm ci` →
`npm run build` → upload `out/` as a Pages artifact → deploy.

## Content System

File-based, no CMS. Chapters are MDX files with YAML frontmatter, mirroring
the original spec's Section 7:

```text
content/
  book/
    foundations/
      01-the-first-agent.mdx
      02-dogfooding.mdx
    evolution/
      01-ask-product.mdx
      02-bitbot.mdx
  pages/
    about.mdx
  diagrams/
    ask-product-routing.ts
    bitbot-evaluation.ts
```

Required frontmatter: `title`, `slug`, `part`, `partTitle`, `chapterNumber`,
`summary`, `status` (`draft` | `published`), `previous`, `next`. Optional:
`featuredImage`, `videoPoster`, `updatedDate`, `readingTime`, `theme`,
`fullWidth`.

### Content layer

Hand-rolled, not a schema-validated tool like Velite/Contentlayer —
consistent with "simple to maintain" and avoiding unnecessary dependencies.

- `gray-matter` parses frontmatter.
- `next-mdx-remote` (RSC-compatible) renders MDX with the approved custom
  component set injected.
- `lib/content.ts` is the single utility layer, implementing:
  `getAllChapters()`, `getPublishedChapters()`, `getChapterBySlug()`,
  `getTableOfContents()`, `getAdjacentChapters()`.

Draft chapters are excluded from `getPublishedChapters()` /
`getTableOfContents()` but remain readable via direct route in local dev.
Since production is a single static export with no separate
preview/production distinction, **draft chapters are excluded from the
production build's `generateStaticParams` entirely** — they simply don't
get a page. (This is a deliberate simplification over the original spec's
"available on preview deployments" language, which assumed a
Vercel-style preview environment that doesn't exist here.)

### Diagram data

Interactive diagram data lives separately from chapter content in
`content/diagrams/*.ts`, each exporting a typed structure of nodes, edges,
labels, and optional animation steps (per original spec Section 11/12).
Diagram renderer components take this data, not hard-coded markup.

## Styling

Tailwind CSS. Design tokens lifted from momoGood's `momostyle` repo
(`packages/ui/src/styles/theme.css`) and reimplemented natively in this
project — **no dependency on `@momosystem/ui`**:

- Fonts: Outfit Variable (headings), Work Sans Variable (body)
- Brand colors: coral, crimson, night-sky, periwinkle, parchment,
  pure-white
- Semantic tokens: background, foreground, muted, accent, border, ring,
  etc., following the same naming pattern as momostyle so the mapping
  stays legible if tokens are refreshed from source later
- Fluid type ramp (clamp-based, mobile→desktop)

Shared visual components stay minimal per original spec Section 18:
Button, Link, Container, Callout, Accordion, media frame, navigation item.
No large component library.

## Pages & Routes

```text
/                          Home
/contents                  Table of contents
/book/[part]/[chapter]     Chapter pages
/about                     Static MDX page
/appendix/[slug]           Optional appendix (scaffolded, empty initially)
```

## V1 Scope

V1 targets the original spec's Definition of Done (Section 26) and its
three proof-of-functionality examples (Section 22) — not the full set of
~15 content components at full fidelity. Everything below is "must work,"
not "must be polished":

**Pages:** Home (hero, overview, one featured visual, chapter preview,
continue-reading via localStorage), Table of Contents (generated from
metadata, grouped by part), Chapter pages (header, MDX body, section nav,
reading progress, prev/next, return-to-contents), About (static MDX).

**Layout modes:** Standard, Wide, Full-bleed sections — reusable in any
chapter.

**Proof examples (real, not mocked):**
1. One embedded video, plain `<video>` playback from an MP4 URL/local file
   (no streaming provider integration yet — deferred until real footage
   exists)
2. One Mermaid diagram rendered from chart syntax
3. One animated system flow: Slack Question → Approved Answer Search →
   Router → Product Classification → Response → BitBot Evaluation →
   Human Review, with step forward/back, play/pause/restart, and
   highlighted active nodes, driven by data in `content/diagrams/`

**Content components, minimal-but-real:** `VideoEmbed`, `MermaidDiagram`,
`AnimatedFlow`, `TechnicalDetail` (expand/collapse), `CodeBlock` (syntax
highlighting + copy), `Callout`, `Quote`.

**Deferred to a follow-up pass** (stub or skip entirely in v1, add once
the core reading experience is validated): `SystemDiagram` (generic
data-driven advanced diagrams beyond Mermaid), `ImageGallery`,
`Comparison`, `Timeline`, streaming video provider integration, appendix
content.

## Placeholder Content

All four parts from the original spec (Section 20), used as-is:

- **Part I: The Beginning** — Introduction, The First Agent, Dogfooding
  the System
- **Part II: The Platform Evolves** — Ask Product, BitBot and Evals,
  Fastlane
- **Part III: The Shared System** — Reusable Tools, Context and Evidence,
  Organizational Learning
- **Part IV: What Changed** — The Ideas Factory, Human Judgment, Lessons
  Learned

All placeholder chapters ship as `status: draft` except the handful
carrying the three proof examples, which ship `published` so the generated
Table of Contents has real content to point at.

## Explicitly Out of Scope

Unchanged from the original spec (Section 24): no CMS, database, auth,
user accounts, comments, search, analytics, payments, subscriptions,
email capture, localization, social features, visual page/diagram
builders, admin dashboard, public API, mobile app, AI chat interface,
semantic retrieval, or automated content generation.

Additionally out of scope for this iteration specifically: streaming
video provider integration, GitHub Actions PR-preview deployments,
`SystemDiagram`/`Comparison`/`Timeline`/`ImageGallery` components (all
deferred, see V1 Scope above).
