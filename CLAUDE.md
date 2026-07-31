# Agentic Journey

Interactive personal book/website about building an agentic development platform. Personal project — no Shortcut tickets, no PR-review workflow; standard git worktree + branch + commit hygiene still applies.

## Key documents

- Design spec: `docs/superpowers/specs/2026-07-24-agentic-journey-website-design.md` — authoritative over the original ChatGPT-drafted spec it supersedes.
- Implementation plan: `docs/superpowers/plans/2026-07-24-agentic-journey-website.md`
- Book strategic vision: `docs/private/book-vision.md` — **read this before touching any chapter content.** Purpose, core thesis, central narrative, personal-perspective angle (Jon writing as the person who built the system), major themes, the proposed 11-chapter structure, visual/writing style, company values, and a "Notes to Develop" scratchpad of raw ideas not yet resolved into chapters (append new ones there as Jon shares them, don't wait for them to be fully formed).

## Public vs. private content — read before creating or committing any file

This repo is public (`jgranger/jgranger.github.io`, required for free-tier GitHub Pages hosting at the root). **Only technical structure/scaffolding is public.** Jon's actual writing, story ideas, personal anecdotes, and strategic-vision material must never be committed or pushed — they go in `docs/private/`, which is gitignored. Structure that's fine to commit publicly: chapter scaffolding (frontmatter, routing, placeholder MDX with generic text), specs/plans, component code, config. Before committing anything containing prose/ideas rather than code/structure, check whether it belongs in `docs/private/` instead. If genuinely unsure, ask before committing.

## Binding constraints (see design spec for full detail)

- Next.js App Router, static export only (`output: 'export'`). No API routes, route handlers, server actions, middleware, or ISR — every interactive feature is client-side JS.
- npm only, no pnpm/yarn.
- No dependency on `@momosystem/ui` or any momoStyle package — design tokens are copied as static values into this repo's own `styles/globals.css`.
- Deployed to GitHub Pages at the root of `jgranger.github.io` (this repo was renamed from `agentic-journey` specifically for that).
- Draft chapters (`status: draft`) get no page in the production build.

## Current status (2026-07-28)

The v1 website (all 22 tasks from the implementation plan) is built, reviewed, merged to `main`, and deployed — live at https://jgranger.github.io/. Home, Table of Contents, About, and 4 chapters are published; 8 chapters exist as drafts (excluded from the build). All chapter content right now is placeholder text written from titles alone — it does NOT yet reflect `docs/private/book-vision.md`'s thesis, voice, or structure. Jon is writing the real prose himself going forward; my role is helping get the chapter taxonomy/topics right and building out site features as needed, not drafting book content. Do not invent real company facts, metrics, quotes, or outcomes — see the design spec's explicit constraint on this.

## Execution model

**Default to parallel multi-agent execution (the Workflow tool) for implementation work, not sequential one-task-at-a-time dispatch.** When picking up the implementation plan, group tasks into dependency-respecting parallel waves rather than working through them one at a time. Parallel agents that write files must not share a git working tree — pre-provision one git worktree per parallel task and merge sequentially afterward.
