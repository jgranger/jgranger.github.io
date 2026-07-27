# Agentic Journey

Interactive personal book/website about building an agentic development platform. Personal project — no Shortcut tickets, no PR-review workflow; standard git worktree + branch + commit hygiene still applies.

## Key documents

- Design spec: `docs/superpowers/specs/2026-07-24-agentic-journey-website-design.md` — authoritative over the original ChatGPT-drafted spec it supersedes.
- Implementation plan: `docs/superpowers/plans/2026-07-24-agentic-journey-website.md`

## Binding constraints (see design spec for full detail)

- Next.js App Router, static export only (`output: 'export'`). No API routes, route handlers, server actions, middleware, or ISR — every interactive feature is client-side JS.
- npm only, no pnpm/yarn.
- No dependency on `@momosystem/ui` or any momoStyle package — design tokens are copied as static values into this repo's own `styles/globals.css`.
- Deployed to GitHub Pages at the root of `jgranger.github.io` (this repo was renamed from `agentic-journey` specifically for that).
- Draft chapters (`status: draft`) get no page in the production build.

## Execution model

**Default to parallel multi-agent execution (the Workflow tool) for implementation work, not sequential one-task-at-a-time dispatch.** When picking up the implementation plan, group tasks into dependency-respecting parallel waves rather than working through them one at a time. Parallel agents that write files must not share a git working tree — pre-provision one git worktree per parallel task and merge sequentially afterward.
