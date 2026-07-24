# Agentic Journey Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 interactive book website — file-based MDX content, generated table of contents, chapter reading UX (progress, section nav, prev/next), three working interactive proof examples (video, Mermaid, animated flow), and a GitHub Pages static-export deployment pipeline.

**Architecture:** Next.js App Router with `output: 'export'` (fully static, no server). Content lives as MDX + frontmatter under `content/`, parsed by a hand-rolled `lib/content.ts`. MDX renders through `next-mdx-remote/rsc` with an injected component map. Tailwind v4 CSS-based theme, tokens ported from momoStyle. Deployed via GitHub Actions to the GitHub Pages root of `jgranger.github.io`.

**Tech Stack:** Next.js (App Router, TypeScript), React 19, Tailwind CSS v4, `gray-matter`, `next-mdx-remote`, `mermaid`, `motion`, Vitest + React Testing Library, npm.

## Global Constraints

- Static export only: `next.config.ts` sets `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`. No API routes, route handlers, server actions, middleware, or ISR anywhere in this plan.
- Package manager is npm exclusively (no pnpm/yarn lockfiles).
- No dependency on `@momosystem/ui` or any momoStyle package — tokens are copied as static values into this repo's own `styles/globals.css`, per the values recorded in Task 2.
- Repo root is `~/Documents/projects/personal/agentic-journey/`, remote `git@github.com:jgranger/jgranger.github.io.git`, already `git init`'d with branch `main` and `origin` set (done during brainstorming — do not re-run `git init`).
- Draft chapters (`status: draft`) are excluded from `getPublishedChapters()`, `getTableOfContents()`, and from `generateStaticParams()` for `/book/[part]/[chapter]` — they get no page in the production build at all.
- Every dynamic route must implement `generateStaticParams` — this is what makes static export produce a page per chapter.
- No CMS, database, auth, comments, search, analytics, or any other item listed under "Explicitly Out of Scope" in the design doc.
- Component tests use Vitest + React Testing Library (jsdom environment). Content-layer tests use Vitest with fixture files on disk (no mocking the filesystem — read real temp files).

---

### Task 1: Project scaffold, TypeScript, Vitest

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: a runnable `npm run dev`, `npm run build`, and `npm test` at the end of this task. Every later task assumes these three scripts exist and work.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "agentic-journey",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "^15.4.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "gray-matter": "^4.0.3",
    "next-mdx-remote": "^5.0.0",
    "mermaid": "^11.4.0",
    "motion": "^11.15.0",
    "@mdx-js/react": "^3.1.0",
    "@fontsource-variable/outfit": "^5.1.0",
    "@fontsource-variable/work-sans": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "jsdom": "^25.0.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.4.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd ~/Documents/projects/personal/agentic-journey && npm install`
Expected: installs succeed, `package-lock.json` is created.

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

- [ ] **Step 5: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 7: Write `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Agentic Journey",
  description: "An interactive book about building an agentic development platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Write a placeholder `app/page.tsx` (Home is built fully in Task 12)**

```tsx
export default function HomePage() {
  return <main>Agentic Journey</main>;
}
```

- [ ] **Step 10: Write a minimal `styles/globals.css` so the build compiles (full tokens land in Task 2)**

```css
@import "tailwindcss";
```

- [ ] **Step 11: Write `.gitignore`**

```text
node_modules/
.next/
out/
*.log
.DS_Store
```

- [ ] **Step 12: Verify dev server boots**

Run: `npm run dev` (then Ctrl+C after confirming)
Expected: server starts on `http://localhost:3000` with no errors; visiting it shows "Agentic Journey".

- [ ] **Step 13: Verify production build**

Run: `npm run build`
Expected: build succeeds, `out/` directory is created containing `index.html`.

- [ ] **Step 14: Verify test runner**

Run: `npm test`
Expected: "No test files found" (not an error — no tests exist yet) or passes with 0 tests.

- [ ] **Step 15: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts vitest.config.ts vitest.setup.ts app/layout.tsx app/page.tsx styles/globals.css .gitignore
git commit -m "Scaffold Next.js static-export project with Vitest"
```

---

### Task 2: Design tokens (`styles/globals.css`)

**Files:**
- Modify: `styles/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes and CSS custom properties consumed by every component task from here on: `bg-background`, `text-foreground`, `text-foreground-secondary`, `text-foreground-subtle`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-accent`, `text-accent-foreground`, `bg-coral`, `text-coral-foreground`, `bg-crimson`, `font-heading`, `font-sans`, plus utility classes `.text-h1` through `.text-h6`, `.text-lead`, `.text-p1`, `.text-p2`, `.text-small`, `.text-eyebrow`, and `--radius-*` custom properties. Dark mode via `.dark` class on `<html>` (not wired to a toggle in v1 — system-preference only, added in Task 3).

- [ ] **Step 1: Write the full token file**

```css
@import "tailwindcss";
@import "@fontsource-variable/outfit";
@import "@fontsource-variable/work-sans";

@theme inline {
  --font-sans: "Work Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --font-heading: "Outfit Variable", ui-sans-serif, system-ui, sans-serif;

  --color-coral: var(--brand-coral-500);
  --color-coral-foreground: var(--coral-foreground);
  --color-crimson: var(--brand-crimson-500);
  --color-crimson-700: var(--brand-crimson-700);
  --color-crimson-foreground: var(--crimson-foreground);
  --color-night-sky: var(--brand-night-sky);
  --color-periwinkle: var(--brand-periwinkle);
  --color-parchment: var(--brand-parchment);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-foreground-secondary: var(--foreground-secondary);
  --color-foreground-subtle: var(--foreground-subtle);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);

  --text-h1: clamp(3rem, 2.47rem + 2.25vw, 4.5rem);
  --text-h1--line-height: clamp(4rem, 3.47rem + 2.25vw, 5.5rem);
  --text-h2: clamp(2.5rem, 2.15rem + 1.5vw, 3.5rem);
  --text-h2--line-height: clamp(3rem, 2.65rem + 1.5vw, 4rem);
  --text-h3: clamp(2rem, 1.82rem + 0.75vw, 2.5rem);
  --text-h3--line-height: clamp(2.5rem, 2.32rem + 0.75vw, 3rem);
  --text-h4: clamp(1.25rem, 1.16rem + 0.38vw, 1.5rem);
  --text-h4--line-height: 2rem;
  --text-h5: clamp(1.25rem, 1.16rem + 0.38vw, 1.5rem);
  --text-h5--line-height: clamp(1.5rem, 1.32rem + 0.75vw, 2rem);
  --text-h6: clamp(1rem, 0.955rem + 0.19vw, 1.125rem);
  --text-h6--line-height: clamp(1.5rem, 1.41rem + 0.38vw, 1.75rem);
  --text-lead: clamp(1rem, 0.91rem + 0.38vw, 1.25rem);
  --text-lead--line-height: clamp(1.5rem, 1.32rem + 0.75vw, 2rem);
  --text-p1: clamp(0.875rem, 0.83rem + 0.19vw, 1rem);
  --text-p1--line-height: clamp(1.25rem, 1.16rem + 0.38vw, 1.5rem);
  --text-p2: clamp(0.75rem, 0.71rem + 0.19vw, 0.875rem);
  --text-p2--line-height: clamp(1rem, 0.91rem + 0.38vw, 1.25rem);
  --text-small: clamp(0.625rem, 0.58rem + 0.19vw, 0.75rem);
  --text-small--line-height: clamp(0.875rem, 0.83rem + 0.19vw, 1rem);
  --text-eyebrow: clamp(0.625rem, 0.58rem + 0.19vw, 0.75rem);
  --text-eyebrow--line-height: clamp(0.75rem, 0.71rem + 0.19vw, 0.875rem);
  --text-eyebrow--letter-spacing: 0.0625rem;

  --width-reading: 42rem;
  --width-wide: 64rem;
}

:root {
  --brand-coral-500: #fc5c50;
  --brand-crimson-500: #a4275e;
  --brand-crimson-700: #7e1941;
  --brand-night-sky: #2d2c3e;
  --brand-periwinkle: #baccfa;
  --brand-parchment: #f3f2e6;
  --brand-pure-white: #ffffff;

  --background: var(--brand-pure-white);
  --foreground: var(--brand-night-sky);
  --foreground-secondary: color-mix(in oklab, var(--foreground) 75%, transparent);
  --foreground-subtle: color-mix(in oklab, var(--foreground) 55%, transparent);
  --muted: var(--brand-parchment);
  --muted-foreground: color-mix(in oklab, var(--brand-night-sky) 65%, transparent);
  --accent: var(--brand-crimson-500);
  --accent-foreground: var(--brand-pure-white);
  --border: color-mix(in oklab, var(--brand-night-sky) 12%, transparent);
  --ring: color-mix(in oklab, var(--brand-coral-500) 60%, transparent);
  --coral-foreground: var(--brand-night-sky);
  --crimson-foreground: var(--brand-parchment);

  --radius: 0.75rem;
}

.dark {
  --background: var(--brand-night-sky);
  --foreground: var(--brand-parchment);
  --foreground-secondary: color-mix(in oklab, var(--foreground) 75%, transparent);
  --foreground-subtle: color-mix(in oklab, var(--foreground) 55%, transparent);
  --muted: #3a3950;
  --muted-foreground: color-mix(in oklab, var(--brand-parchment) 70%, transparent);
  --accent: var(--brand-crimson-500);
  --accent-foreground: var(--brand-parchment);
  --border: color-mix(in oklab, var(--brand-parchment) 12%, transparent);
  --ring: color-mix(in oklab, var(--brand-coral-500) 60%, transparent);
  --coral-foreground: var(--brand-night-sky);
  --crimson-foreground: var(--brand-parchment);
}

@layer utilities {
  .font-heading { font-family: var(--font-heading); }
  .text-h1 { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-h1); line-height: var(--text-h1--line-height); }
  .text-h2 { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-h2); line-height: var(--text-h2--line-height); }
  .text-h3 { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-h3); line-height: var(--text-h3--line-height); }
  .text-h4 { font-family: var(--font-heading); font-weight: 500; font-size: var(--text-h4); line-height: var(--text-h4--line-height); }
  .text-h5 { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-h5); line-height: var(--text-h5--line-height); }
  .text-h6 { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-h6); line-height: var(--text-h6--line-height); }
  .text-lead { font-family: var(--font-sans); font-weight: 400; font-size: var(--text-lead); line-height: var(--text-lead--line-height); }
  .text-p1 { font-family: var(--font-sans); font-weight: 400; font-size: var(--text-p1); line-height: var(--text-p1--line-height); }
  .text-p2 { font-family: var(--font-sans); font-weight: 400; font-size: var(--text-p2); line-height: var(--text-p2--line-height); }
  .text-small { font-family: var(--font-sans); font-weight: 400; font-size: var(--text-small); line-height: var(--text-small--line-height); }
  .text-eyebrow { font-family: var(--font-sans); font-weight: 400; font-size: var(--text-eyebrow); line-height: var(--text-eyebrow--line-height); letter-spacing: var(--text-eyebrow--letter-spacing); text-transform: uppercase; }
}

@layer base {
  html { font-family: var(--font-sans); }
  body { background: var(--color-background); color: var(--color-foreground); }
  h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); font-weight: 600; }
}
```

- [ ] **Step 2: Verify build still succeeds**

Run: `npm run build`
Expected: succeeds with no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add styles/globals.css
git commit -m "Add momoStyle-derived design tokens"
```

---

### Task 3: Types for content and diagrams

**Files:**
- Create: `types/content.ts`
- Create: `types/diagrams.ts`

**Interfaces:**
- Produces: `ChapterMeta`, `Chapter`, `TocPart`, `TocEntry` (from `types/content.ts`); `DiagramNode`, `DiagramEdge`, `DiagramData`, `FlowStep`, `FlowData` (from `types/diagrams.ts`). Every later task that touches content or diagrams imports from these two files — do not redefine these shapes elsewhere.

- [ ] **Step 1: Write `types/content.ts`**

```ts
export type ChapterStatus = "draft" | "published";

export interface ChapterMeta {
  title: string;
  slug: string;
  part: string;
  partTitle: string;
  chapterNumber: number;
  summary: string;
  status: ChapterStatus;
  previous: string | null;
  next: string | null;
  featuredImage?: string;
  videoPoster?: string;
  updatedDate?: string;
  readingTime?: string;
  fullWidth?: boolean;
}

export interface Chapter {
  meta: ChapterMeta;
  content: string;
  filePath: string;
}

export interface TocEntry {
  title: string;
  slug: string;
  part: string;
  chapterNumber: number;
  summary: string;
  status: ChapterStatus;
}

export interface TocPart {
  part: string;
  partTitle: string;
  chapters: TocEntry[];
}

export interface AdjacentChapters {
  previous: TocEntry | null;
  next: TocEntry | null;
}

export interface Heading {
  depth: 2 | 3;
  text: string;
  slug: string;
}
```

- [ ] **Step 2: Write `types/diagrams.ts`**

```ts
export interface DiagramNode {
  id: string;
  label: string;
  description?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface FlowStep {
  activeNodes: string[];
  activeEdges?: string[];
  text: string;
}

export interface FlowData extends DiagramData {
  steps: FlowStep[];
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add types/content.ts types/diagrams.ts
git commit -m "Add content and diagram type definitions"
```

---

### Task 4: Content layer — `lib/content.ts` core functions

**Files:**
- Create: `lib/content.ts`
- Create: `lib/content.test.ts`
- Create fixtures: `lib/__fixtures__/content/book/part-a/01-first.mdx`, `lib/__fixtures__/content/book/part-a/02-second.mdx`, `lib/__fixtures__/content/book/part-b/01-third.mdx`

**Interfaces:**
- Consumes: `ChapterMeta`, `Chapter`, `TocPart`, `TocEntry`, `AdjacentChapters` from `types/content.ts` (Task 3).
- Produces: `getAllChapters(contentDir: string): Chapter[]`, `getPublishedChapters(contentDir: string): Chapter[]`, `getChapterBySlug(contentDir: string, slug: string): Chapter | null`, `getTableOfContents(contentDir: string): TocPart[]`, `getAdjacentChapters(contentDir: string, slug: string): AdjacentChapters`. All five take an explicit `contentDir` parameter (not a hardcoded path) so tests can point them at fixtures — production call sites (Tasks 8, 9, 13) pass `path.join(process.cwd(), "content/book")`.

- [ ] **Step 1: Write fixture chapters**

`lib/__fixtures__/content/book/part-a/01-first.mdx`:
```mdx
---
title: First Chapter
slug: first-chapter
part: part-a
partTitle: Part A
chapterNumber: 1
summary: The first chapter summary.
status: published
previous: null
next: second-chapter
---

# First Chapter

Some content.
```

`lib/__fixtures__/content/book/part-a/02-second.mdx`:
```mdx
---
title: Second Chapter
slug: second-chapter
part: part-a
partTitle: Part A
chapterNumber: 2
summary: The second chapter summary.
status: draft
previous: first-chapter
next: third-chapter
---

# Second Chapter

Draft content, should be excluded from published lists.
```

`lib/__fixtures__/content/book/part-b/01-third.mdx`:
```mdx
---
title: Third Chapter
slug: third-chapter
part: part-b
partTitle: Part B
chapterNumber: 1
summary: The third chapter summary.
status: published
previous: second-chapter
next: null
---

# Third Chapter

Some content in a different part.
```

- [ ] **Step 2: Write the failing test file**

```ts
import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  getAllChapters,
  getPublishedChapters,
  getChapterBySlug,
  getTableOfContents,
  getAdjacentChapters,
} from "./content";

const FIXTURE_DIR = path.join(__dirname, "__fixtures__/content/book");

describe("getAllChapters", () => {
  it("returns all chapters including drafts, sorted by part then chapter number", () => {
    const chapters = getAllChapters(FIXTURE_DIR);
    expect(chapters.map((c) => c.meta.slug)).toEqual([
      "first-chapter",
      "second-chapter",
      "third-chapter",
    ]);
  });
});

describe("getPublishedChapters", () => {
  it("excludes draft chapters", () => {
    const chapters = getPublishedChapters(FIXTURE_DIR);
    expect(chapters.map((c) => c.meta.slug)).toEqual([
      "first-chapter",
      "third-chapter",
    ]);
  });
});

describe("getChapterBySlug", () => {
  it("returns the matching chapter", () => {
    const chapter = getChapterBySlug(FIXTURE_DIR, "second-chapter");
    expect(chapter?.meta.title).toBe("Second Chapter");
    expect(chapter?.content).toContain("Draft content");
  });

  it("returns null for an unknown slug", () => {
    expect(getChapterBySlug(FIXTURE_DIR, "does-not-exist")).toBeNull();
  });
});

describe("getTableOfContents", () => {
  it("groups published chapters by part, excluding drafts", () => {
    const toc = getTableOfContents(FIXTURE_DIR);
    expect(toc).toEqual([
      {
        part: "part-a",
        partTitle: "Part A",
        chapters: [
          {
            title: "First Chapter",
            slug: "first-chapter",
            part: "part-a",
            chapterNumber: 1,
            summary: "The first chapter summary.",
            status: "published",
          },
        ],
      },
      {
        part: "part-b",
        partTitle: "Part B",
        chapters: [
          {
            title: "Third Chapter",
            slug: "third-chapter",
            part: "part-b",
            chapterNumber: 1,
            summary: "The third chapter summary.",
            status: "published",
          },
        ],
      },
    ]);
  });
});

describe("getAdjacentChapters", () => {
  it("resolves previous and next by slug, ignoring draft status", () => {
    const adjacent = getAdjacentChapters(FIXTURE_DIR, "third-chapter");
    expect(adjacent.previous?.slug).toBe("second-chapter");
    expect(adjacent.next).toBeNull();
  });

  it("returns null previous for the first chapter", () => {
    const adjacent = getAdjacentChapters(FIXTURE_DIR, "first-chapter");
    expect(adjacent.previous).toBeNull();
    expect(adjacent.next?.slug).toBe("second-chapter");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/content.test.ts`
Expected: FAIL — `./content` module has no exported members (file doesn't exist yet).

- [ ] **Step 4: Implement `lib/content.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  Chapter,
  ChapterMeta,
  TocPart,
  TocEntry,
  AdjacentChapters,
} from "@/types/content";

function walkMdxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }
  return files;
}

function sortChapters(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort((a, b) => {
    if (a.meta.part !== b.meta.part) {
      return a.meta.part.localeCompare(b.meta.part);
    }
    return a.meta.chapterNumber - b.meta.chapterNumber;
  });
}

export function getAllChapters(contentDir: string): Chapter[] {
  const files = walkMdxFiles(contentDir);
  const chapters = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      meta: data as ChapterMeta,
      content,
      filePath,
    };
  });
  return sortChapters(chapters);
}

export function getPublishedChapters(contentDir: string): Chapter[] {
  return getAllChapters(contentDir).filter(
    (chapter) => chapter.meta.status === "published"
  );
}

export function getChapterBySlug(
  contentDir: string,
  slug: string
): Chapter | null {
  const chapter = getAllChapters(contentDir).find(
    (c) => c.meta.slug === slug
  );
  return chapter ?? null;
}

function toTocEntry(chapter: Chapter): TocEntry {
  return {
    title: chapter.meta.title,
    slug: chapter.meta.slug,
    part: chapter.meta.part,
    chapterNumber: chapter.meta.chapterNumber,
    summary: chapter.meta.summary,
    status: chapter.meta.status,
  };
}

export function getTableOfContents(contentDir: string): TocPart[] {
  const published = getPublishedChapters(contentDir);
  const partsInOrder: string[] = [];
  const partTitleByKey = new Map<string, string>();
  for (const chapter of published) {
    if (!partsInOrder.includes(chapter.meta.part)) {
      partsInOrder.push(chapter.meta.part);
      partTitleByKey.set(chapter.meta.part, chapter.meta.partTitle);
    }
  }
  return partsInOrder.map((part) => ({
    part,
    partTitle: partTitleByKey.get(part) as string,
    chapters: published
      .filter((c) => c.meta.part === part)
      .map(toTocEntry),
  }));
}

export function getAdjacentChapters(
  contentDir: string,
  slug: string
): AdjacentChapters {
  const chapter = getChapterBySlug(contentDir, slug);
  if (!chapter) {
    return { previous: null, next: null };
  }
  const previousChapter = chapter.meta.previous
    ? getChapterBySlug(contentDir, chapter.meta.previous)
    : null;
  const nextChapter = chapter.meta.next
    ? getChapterBySlug(contentDir, chapter.meta.next)
    : null;
  return {
    previous: previousChapter ? toTocEntry(previousChapter) : null,
    next: nextChapter ? toTocEntry(nextChapter) : null,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/content.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts lib/content.test.ts lib/__fixtures__
git commit -m "Add content layer with fixture-backed tests"
```

---

### Task 5: Heading extraction utility

**Files:**
- Create: `lib/headings.ts`
- Create: `lib/headings.test.ts`

**Interfaces:**
- Consumes: `Heading` from `types/content.ts` (Task 3).
- Produces: `extractHeadings(mdxSource: string): Heading[]`, `slugifyHeading(text: string): string`. Consumed by `ChapterNavigation` (Task 10) and the chapter page (Task 13).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { extractHeadings, slugifyHeading } from "./headings";

describe("slugifyHeading", () => {
  it("lowercases, strips punctuation, and hyphenates", () => {
    expect(slugifyHeading("Why We Built It?")).toBe("why-we-built-it");
  });
});

describe("extractHeadings", () => {
  it("extracts h2 and h3 headings with generated slugs, ignoring h1 and deeper levels", () => {
    const source = `# Chapter Title

Some intro text.

## Why We Built It

Body text.

### A Sub-Point

More text.

#### Too Deep

## Second Section
`;
    expect(extractHeadings(source)).toEqual([
      { depth: 2, text: "Why We Built It", slug: "why-we-built-it" },
      { depth: 3, text: "A Sub-Point", slug: "a-sub-point" },
      { depth: 2, text: "Second Section", slug: "second-section" },
    ]);
  });

  it("ignores lines inside fenced code blocks", () => {
    const source = `## Real Heading

\`\`\`
## Not A Heading
\`\`\`

## Another Real Heading
`;
    expect(extractHeadings(source)).toEqual([
      { depth: 2, text: "Real Heading", slug: "real-heading" },
      { depth: 2, text: "Another Real Heading", slug: "another-real-heading" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/headings.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/headings.ts`**

```ts
import type { Heading } from "@/types/content";

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function extractHeadings(mdxSource: string): Heading[] {
  const lines = mdxSource.split("\n");
  const headings: Heading[] = [];
  let insideFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;

    const depth = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ depth, text, slug: slugifyHeading(text) });
  }

  return headings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/headings.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/headings.ts lib/headings.test.ts
git commit -m "Add heading extraction utility for chapter section nav"
```

---

### Task 6: MDX rendering pipeline (`lib/mdx.tsx`)

**Files:**
- Create: `lib/mdx.tsx`

**Interfaces:**
- Consumes: nothing new (uses `next-mdx-remote/rsc`).
- Produces: `renderMdx(source: string, components: Record<string, React.ComponentType<any>>): Promise<React.ReactElement>` — a thin wrapper around `next-mdx-remote/rsc`'s `MDXRemote` with `rehype-slug` wired in so rendered `<h2>`/`<h3>` elements get `id` attributes matching `slugifyHeading` from Task 5 (so in-page anchor links from `ChapterNavigation` land correctly). This is exercised indirectly by the chapter page in Task 13 — no standalone unit test here since it's a thin render wrapper; correctness is verified visually via `npm run dev` in Task 13's manual check.

**Files:**
- Modify: `package.json` (add `rehype-slug`)

- [ ] **Step 1: Add `rehype-slug`**

Run: `npm install rehype-slug`

- [ ] **Step 2: Implement `lib/mdx.tsx`**

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import type { ComponentType } from "react";

export async function renderMdx(
  source: string,
  components: Record<string, ComponentType<any>>
) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/mdx.tsx package.json package-lock.json
git commit -m "Add MDX render wrapper with heading slugs"
```

---

### Task 7: Layout section wrappers (`WideSection`, `FullBleedSection`) and `Callout`

**Files:**
- Create: `components/content/WideSection.tsx`
- Create: `components/content/FullBleedSection.tsx`
- Create: `components/content/Callout.tsx`
- Create: `components/content/Callout.test.tsx`

**Interfaces:**
- Produces: `WideSection({ children }: { children: React.ReactNode })`, `FullBleedSection({ children }: { children: React.ReactNode })`, `Callout({ type, children }: { type: "insight" | "lesson" | "warning" | "context" | "result"; children: React.ReactNode })`. All three are registered in the MDX component map in Task 13.

- [ ] **Step 1: Implement `WideSection`**

```tsx
export function WideSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 w-full max-w-(--width-wide) mx-auto px-4">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Implement `FullBleedSection`**

```tsx
export function FullBleedSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 w-screen relative left-1/2 -translate-x-1/2">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Write the failing test for `Callout`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Callout } from "./Callout";

describe("Callout", () => {
  it("renders its children", () => {
    render(<Callout type="insight">Something worth noting.</Callout>);
    expect(screen.getByText("Something worth noting.")).toBeInTheDocument();
  });

  it("labels each callout type for screen readers", () => {
    render(<Callout type="warning">Careful here.</Callout>);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run components/content/Callout.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `Callout`**

```tsx
const LABELS = {
  insight: "Insight",
  lesson: "Lesson",
  warning: "Warning",
  context: "Context",
  result: "Result",
} as const;

type CalloutType = keyof typeof LABELS;

export function Callout({
  type,
  children,
}: {
  type: CalloutType;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-lg border border-border bg-muted p-4">
      <p className="text-eyebrow text-foreground-subtle mb-2">
        {LABELS[type]}
      </p>
      <div className="text-p1 text-foreground-secondary">{children}</div>
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run components/content/Callout.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 7: Commit**

```bash
git add components/content/WideSection.tsx components/content/FullBleedSection.tsx components/content/Callout.tsx components/content/Callout.test.tsx
git commit -m "Add layout section wrappers and Callout component"
```

---

### Task 8: `Quote` and `CodeBlock` components

**Files:**
- Create: `components/content/Quote.tsx`
- Create: `components/content/CodeBlock.tsx`
- Create: `components/content/CodeBlock.test.tsx`

**Interfaces:**
- Produces: `Quote({ children, attribution }: { children: React.ReactNode; attribution?: string })`, `CodeBlock({ code, language, fileName, highlightLines }: { code: string; language: string; fileName?: string; highlightLines?: number[] })`. Both registered in the MDX component map in Task 13. `CodeBlock` renders a copy button with `data-testid="copy-code-button"`.

- [ ] **Step 1: Implement `Quote`**

```tsx
export function Quote({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="my-6 border-l-4 border-accent pl-4">
      <p className="text-lead font-heading text-foreground">{children}</p>
      {attribution && (
        <cite className="text-small text-foreground-subtle block mt-2">
          {attribution}
        </cite>
      )}
    </blockquote>
  );
}
```

- [ ] **Step 2: Write the failing test for `CodeBlock`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("renders the file name and code", () => {
    render(
      <CodeBlock code="const x = 1;" language="ts" fileName="example.ts" />
    );
    expect(screen.getByText("example.ts")).toBeInTheDocument();
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("copies the code to the clipboard when the copy button is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="const x = 1;" language="ts" />);
    fireEvent.click(screen.getByTestId("copy-code-button"));

    expect(writeText).toHaveBeenCalledWith("const x = 1;");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/content/CodeBlock.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `CodeBlock`**

```tsx
"use client";

import { useState } from "react";

export function CodeBlock({
  code,
  language,
  fileName,
  highlightLines = [],
}: {
  code: string;
  language: string;
  fileName?: string;
  highlightLines?: number[];
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-night-sky px-4 py-2">
        <span className="text-small text-parchment">
          {fileName ?? language}
        </span>
        <button
          type="button"
          data-testid="copy-code-button"
          onClick={handleCopy}
          className="text-small text-parchment underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-night-sky p-4 text-parchment text-sm">
        <code>
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                highlightLines.includes(i + 1) ? "bg-crimson-700/30 -mx-4 px-4" : undefined
              }
            >
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/content/CodeBlock.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add components/content/Quote.tsx components/content/CodeBlock.tsx components/content/CodeBlock.test.tsx
git commit -m "Add Quote and CodeBlock components"
```

---

### Task 9: `TechnicalDetail` (expandable detail)

**Files:**
- Create: `components/content/TechnicalDetail.tsx`
- Create: `components/content/TechnicalDetail.test.tsx`

**Interfaces:**
- Produces: `TechnicalDetail({ title, children }: { title: string; children: React.ReactNode })`, using native `<details>`/`<summary>` (no JS state needed, works without hydration). Registered in the MDX component map in Task 13.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TechnicalDetail } from "./TechnicalDetail";

describe("TechnicalDetail", () => {
  it("hides its content by default and shows the title", () => {
    render(
      <TechnicalDetail title="View evaluation output">
        <p>Secret detail.</p>
      </TechnicalDetail>
    );
    expect(screen.getByText("View evaluation output")).toBeInTheDocument();
    const details = screen.getByText("View evaluation output").closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("reveals its content when the summary is clicked", () => {
    render(
      <TechnicalDetail title="View evaluation output">
        <p>Secret detail.</p>
      </TechnicalDetail>
    );
    screen.getByText("View evaluation output").click();
    const details = screen.getByText("View evaluation output").closest("details");
    expect(details).toHaveAttribute("open");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/content/TechnicalDetail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `TechnicalDetail`**

```tsx
export function TechnicalDetail({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="my-6 rounded-lg border border-border p-4">
      <summary className="text-p1 font-heading cursor-pointer text-accent">
        {title}
      </summary>
      <div className="mt-4 text-p2 text-foreground-secondary">{children}</div>
    </details>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/content/TechnicalDetail.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add components/content/TechnicalDetail.tsx components/content/TechnicalDetail.test.tsx
git commit -m "Add TechnicalDetail expandable component"
```

---

### Task 10: `VideoEmbed`

**Files:**
- Create: `components/media/VideoEmbed.tsx`

**Interfaces:**
- Produces: `VideoEmbed({ src, title, poster, description }: { src: string; title: string; poster?: string; description?: string })`. Plain HTML5 `<video>`, no streaming provider (per design doc — deferred). Registered in the MDX component map in Task 13.

- [ ] **Step 1: Implement `VideoEmbed`**

```tsx
export function VideoEmbed({
  src,
  title,
  poster,
  description,
}: {
  src: string;
  title: string;
  poster?: string;
  description?: string;
}) {
  return (
    <figure className="my-8">
      <video
        controls
        playsInline
        poster={poster}
        aria-label={title}
        className="w-full rounded-lg border border-border"
      >
        <source src={src} />
      </video>
      <figcaption className="mt-2 text-small text-foreground-subtle">
        {title}
        {description && <span> — {description}</span>}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/media/VideoEmbed.tsx
git commit -m "Add VideoEmbed component with plain MP4 playback"
```

---

### Task 11: `MermaidDiagram`

**Files:**
- Create: `components/diagrams/MermaidDiagram.tsx`

**Interfaces:**
- Produces: `MermaidDiagram({ chart }: { chart: string })` — client component, renders Mermaid chart syntax to inline SVG via the `mermaid` package. Registered in the MDX component map in Task 13. No unit test: Mermaid's rendering is a third-party black box behind a `useEffect`; correctness is verified visually via `npm run dev` in Task 14's manual check, consistent with the design doc's plan to prove this with one real example rather than test the library's internals.

- [ ] **Step 1: Implement `MermaidDiagram`**

```tsx
"use client";

import { useEffect, useId, useRef } from "react";
import mermaid from "mermaid";

let initialized = false;

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "-");

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });
      initialized = true;
    }
    let cancelled = false;
    mermaid.render(`mermaid-${id}`, chart).then(({ svg }) => {
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return <div ref={containerRef} className="my-8 overflow-x-auto" />;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/diagrams/MermaidDiagram.tsx
git commit -m "Add MermaidDiagram component"
```

---

### Task 12: `AnimatedFlow` step engine + component

**Files:**
- Create: `lib/flowSteps.ts`
- Create: `lib/flowSteps.test.ts`
- Create: `components/diagrams/AnimatedFlow.tsx`

**Interfaces:**
- Consumes: `FlowStep`, `FlowData` from `types/diagrams.ts` (Task 3).
- Produces (from `lib/flowSteps.ts`, the pure/testable core): `clampStepIndex(index: number, totalSteps: number): number`, `nextStepIndex(current: number, totalSteps: number): number` (returns `current` unchanged if already at the last step — no wraparound), `previousStepIndex(current: number, totalSteps: number): number` (returns `0` unchanged if already at the first step). Produces (from `components/diagrams/AnimatedFlow.tsx`): `AnimatedFlow({ data }: { data: FlowData })`, a client component with play/pause/restart/step controls built on top of the pure functions above.

- [ ] **Step 1: Write the failing test for the pure step logic**

```ts
import { describe, it, expect } from "vitest";
import { clampStepIndex, nextStepIndex, previousStepIndex } from "./flowSteps";

describe("clampStepIndex", () => {
  it("clamps below zero up to zero", () => {
    expect(clampStepIndex(-1, 5)).toBe(0);
  });
  it("clamps above the last index down to the last index", () => {
    expect(clampStepIndex(10, 5)).toBe(4);
  });
  it("passes through valid indices unchanged", () => {
    expect(clampStepIndex(2, 5)).toBe(2);
  });
});

describe("nextStepIndex", () => {
  it("advances by one", () => {
    expect(nextStepIndex(1, 5)).toBe(2);
  });
  it("does not advance past the last step", () => {
    expect(nextStepIndex(4, 5)).toBe(4);
  });
});

describe("previousStepIndex", () => {
  it("goes back by one", () => {
    expect(previousStepIndex(2, 5)).toBe(1);
  });
  it("does not go below the first step", () => {
    expect(previousStepIndex(0, 5)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/flowSteps.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/flowSteps.ts`**

```ts
export function clampStepIndex(index: number, totalSteps: number): number {
  if (index < 0) return 0;
  if (index > totalSteps - 1) return totalSteps - 1;
  return index;
}

export function nextStepIndex(current: number, totalSteps: number): number {
  return clampStepIndex(current + 1, totalSteps);
}

export function previousStepIndex(current: number, totalSteps: number): number {
  return clampStepIndex(current - 1, totalSteps);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/flowSteps.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Implement `components/diagrams/AnimatedFlow.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { FlowData } from "@/types/diagrams";
import {
  clampStepIndex,
  nextStepIndex,
  previousStepIndex,
} from "@/lib/flowSteps";

const AUTO_PLAY_INTERVAL_MS = 2500;

export function AnimatedFlow({ data }: { data: FlowData }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const totalSteps = data.steps.length;
  const currentStep = data.steps[stepIndex];

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= totalSteps - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIndex((i) => nextStepIndex(i, totalSteps));
    }, AUTO_PLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [playing, stepIndex, totalSteps]);

  return (
    <div className="my-8 rounded-lg border border-border p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        {data.nodes.map((node) => (
          <div
            key={node.id}
            data-testid={`flow-node-${node.id}`}
            className={
              currentStep.activeNodes.includes(node.id)
                ? "rounded-md bg-accent text-accent-foreground px-3 py-2 text-p2"
                : "rounded-md bg-muted text-muted-foreground px-3 py-2 text-p2"
            }
          >
            {node.label}
          </div>
        ))}
      </div>

      <p className="text-p1 text-foreground-secondary mb-4" data-testid="flow-step-text">
        {currentStep.text}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex((i) => previousStepIndex(i, totalSteps));
          }}
          disabled={stepIndex === 0}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex((i) => nextStepIndex(i, totalSteps));
          }}
          disabled={stepIndex === totalSteps - 1}
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex(clampStepIndex(0, totalSteps));
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/flowSteps.ts lib/flowSteps.test.ts components/diagrams/AnimatedFlow.tsx
git commit -m "Add AnimatedFlow step engine and component"
```

---

### Task 13: Ask Product flow diagram data

**Files:**
- Create: `content/diagrams/ask-product-flow.ts`

**Interfaces:**
- Consumes: `FlowData` from `types/diagrams.ts` (Task 3).
- Produces: `askProductFlow: FlowData`, imported directly by the chapter MDX file that uses `<AnimatedFlow>` in Task 20 (diagram data files are plain TS modules imported into the page/MDX pipeline, not dynamically loaded by slug — there's exactly one in v1).

- [ ] **Step 1: Implement the flow data**

```ts
import type { FlowData } from "@/types/diagrams";

export const askProductFlow: FlowData = {
  nodes: [
    { id: "slack", label: "Slack Question" },
    { id: "vector-search", label: "Approved Answer Search" },
    { id: "router", label: "Router" },
    { id: "classification", label: "Product Classification" },
    { id: "response", label: "Response" },
    { id: "eval", label: "BitBot Evaluation" },
    { id: "review", label: "Human Review" },
  ],
  edges: [
    { from: "slack", to: "vector-search" },
    { from: "vector-search", to: "router" },
    { from: "router", to: "classification" },
    { from: "classification", to: "response" },
    { from: "response", to: "eval" },
    { from: "eval", to: "review" },
  ],
  steps: [
    {
      activeNodes: ["slack"],
      text: "A question is submitted in Slack.",
    },
    {
      activeNodes: ["vector-search"],
      activeEdges: ["slack-vector-search"],
      text: "The question is compared against approved answers.",
    },
    {
      activeNodes: ["router"],
      activeEdges: ["vector-search-router"],
      text: "A router decides how to handle the match (or lack of one).",
    },
    {
      activeNodes: ["classification"],
      activeEdges: ["router-classification"],
      text: "The question is classified against the relevant product area.",
    },
    {
      activeNodes: ["response"],
      activeEdges: ["classification-response"],
      text: "A response is drafted from the matched approved answer.",
    },
    {
      activeNodes: ["eval"],
      activeEdges: ["response-eval"],
      text: "BitBot evaluates the response before it goes out.",
    },
    {
      activeNodes: ["review"],
      activeEdges: ["eval-review"],
      text: "A human reviews the evaluation result and the final response.",
    },
  ],
};
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add content/diagrams/ask-product-flow.ts
git commit -m "Add Ask Product animated flow data"
```

---

### Task 14: `ChapterProgress` (reading progress bar)

**Files:**
- Create: `components/publication/ChapterProgress.tsx`
- Create: `components/publication/ChapterProgress.test.tsx`

**Interfaces:**
- Produces: `ChapterProgress()` — client component with no props, reads `window.scrollY` / document height on scroll. Rendered once per chapter page in Task 16.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChapterProgress } from "./ChapterProgress";

function setScrollGeometry({
  scrollY,
  scrollHeight,
  innerHeight,
}: {
  scrollY: number;
  scrollHeight: number;
  innerHeight: number;
}) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
}

describe("ChapterProgress", () => {
  beforeEach(() => {
    setScrollGeometry({ scrollY: 0, scrollHeight: 2000, innerHeight: 1000 });
  });

  it("starts at 0% when at the top of the page", () => {
    render(<ChapterProgress />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("updates its value on scroll", () => {
    render(<ChapterProgress />);
    setScrollGeometry({ scrollY: 500, scrollHeight: 2000, innerHeight: 1000 });
    fireEvent.scroll(window);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });

  it("caps at 100%", () => {
    render(<ChapterProgress />);
    setScrollGeometry({ scrollY: 5000, scrollHeight: 2000, innerHeight: 1000 });
    fireEvent.scroll(window);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/publication/ChapterProgress.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ChapterProgress`**

```tsx
"use client";

import { useEffect, useState } from "react";

function computeProgress(): number {
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (scrollableHeight <= 0) return 100;
  const raw = (window.scrollY / scrollableHeight) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function ChapterProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(computeProgress());
    function handleScroll() {
      setProgress(computeProgress());
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 h-1 bg-accent z-50 transition-[width]"
      style={{ width: `${progress}%` }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/publication/ChapterProgress.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/publication/ChapterProgress.tsx components/publication/ChapterProgress.test.tsx
git commit -m "Add ChapterProgress reading progress bar"
```

---

### Task 15: `ChapterNavigation`, `ChapterHeader`, `PrevNextNav`

**Files:**
- Create: `components/publication/ChapterNavigation.tsx`
- Create: `components/publication/ChapterHeader.tsx`
- Create: `components/publication/PrevNextNav.tsx`

**Interfaces:**
- Consumes: `Heading` from `types/content.ts`, `AdjacentChapters` from `types/content.ts`.
- Produces: `ChapterNavigation({ headings }: { headings: Heading[] })` (renders anchor links to `#${slug}`), `ChapterHeader({ partTitle, chapterNumber, title, summary }: { partTitle: string; chapterNumber: number; title: string; summary: string })`, `PrevNextNav({ adjacent }: { adjacent: AdjacentChapters })` (renders links to `/book/${adjacent.previous.part}/${adjacent.previous.slug}` etc., stacked vertically below `md` breakpoint via `flex-col md:flex-row`). All three consumed by the chapter page in Task 16.

- [ ] **Step 1: Implement `ChapterNavigation`**

```tsx
import type { Heading } from "@/types/content";

export function ChapterNavigation({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;
  return (
    <nav aria-label="Chapter sections" className="text-p2">
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li
            key={heading.slug}
            className={heading.depth === 3 ? "ml-4" : undefined}
          >
            <a href={`#${heading.slug}`} className="text-foreground-secondary hover:text-accent">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Implement `ChapterHeader`**

```tsx
export function ChapterHeader({
  partTitle,
  chapterNumber,
  title,
  summary,
}: {
  partTitle: string;
  chapterNumber: number;
  title: string;
  summary: string;
}) {
  return (
    <header className="mb-10">
      <p className="text-eyebrow text-foreground-subtle">
        {partTitle} · Chapter {chapterNumber}
      </p>
      <h1 className="text-h1 mt-2">{title}</h1>
      <p className="text-lead text-foreground-secondary mt-4">{summary}</p>
    </header>
  );
}
```

- [ ] **Step 3: Implement `PrevNextNav`**

```tsx
import Link from "next/link";
import type { AdjacentChapters } from "@/types/content";

export function PrevNextNav({ adjacent }: { adjacent: AdjacentChapters }) {
  return (
    <nav className="mt-16 flex flex-col md:flex-row justify-between gap-4 border-t border-border pt-6">
      <div>
        {adjacent.previous && (
          <Link
            href={`/book/${adjacent.previous.part}/${adjacent.previous.slug}/`}
            className="text-p1 text-accent"
          >
            ← {adjacent.previous.title}
          </Link>
        )}
      </div>
      <div className="text-right">
        {adjacent.next && (
          <Link
            href={`/book/${adjacent.next.part}/${adjacent.next.slug}/`}
            className="text-p1 text-accent"
          >
            {adjacent.next.title} →
          </Link>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/publication/ChapterNavigation.tsx components/publication/ChapterHeader.tsx components/publication/PrevNextNav.tsx
git commit -m "Add chapter section nav, header, and prev/next nav components"
```

---

### Task 16: Chapter page route (`/book/[part]/[chapter]`)

**Files:**
- Create: `app/book/[part]/[chapter]/page.tsx`
- Create: `content/book/.gitkeep` (ensures the directory exists before Task 20 populates it)

**Interfaces:**
- Consumes: `getPublishedChapters`, `getChapterBySlug`, `getAdjacentChapters` from `lib/content.ts` (Task 4); `extractHeadings` from `lib/headings.ts` (Task 5); `renderMdx` from `lib/mdx.tsx` (Task 6); `ChapterHeader`, `ChapterNavigation`, `PrevNextNav`, `ChapterProgress` (Tasks 14, 15); `Callout`, `Quote`, `CodeBlock`, `TechnicalDetail`, `WideSection`, `FullBleedSection` (Tasks 7–9); `VideoEmbed` (Task 10); `MermaidDiagram` (Task 11); `AnimatedFlow` (Task 12).
- Produces: the full MDX component map object (used only here in v1 — if a second MDX-rendering route needs it later, extract it to `lib/mdxComponents.tsx`, but one call site doesn't justify that split yet).

- [ ] **Step 1: Implement the chapter page**

```tsx
import path from "node:path";
import { notFound } from "next/navigation";
import {
  getPublishedChapters,
  getChapterBySlug,
  getAdjacentChapters,
} from "@/lib/content";
import { extractHeadings } from "@/lib/headings";
import { renderMdx } from "@/lib/mdx";
import { ChapterHeader } from "@/components/publication/ChapterHeader";
import { ChapterNavigation } from "@/components/publication/ChapterNavigation";
import { PrevNextNav } from "@/components/publication/PrevNextNav";
import { ChapterProgress } from "@/components/publication/ChapterProgress";
import { Callout } from "@/components/content/Callout";
import { Quote } from "@/components/content/Quote";
import { CodeBlock } from "@/components/content/CodeBlock";
import { TechnicalDetail } from "@/components/content/TechnicalDetail";
import { WideSection } from "@/components/content/WideSection";
import { FullBleedSection } from "@/components/content/FullBleedSection";
import { VideoEmbed } from "@/components/media/VideoEmbed";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import { AnimatedFlow } from "@/components/diagrams/AnimatedFlow";
import { askProductFlow } from "@/content/diagrams/ask-product-flow";

const CONTENT_DIR = path.join(process.cwd(), "content/book");

const MDX_COMPONENTS = {
  Callout,
  Quote,
  CodeBlock,
  TechnicalDetail,
  WideSection,
  FullBleedSection,
  VideoEmbed,
  MermaidDiagram,
  AnimatedFlow: () => <AnimatedFlow data={askProductFlow} />,
};

export function generateStaticParams() {
  return getPublishedChapters(CONTENT_DIR).map((chapter) => ({
    part: chapter.meta.part,
    chapter: chapter.meta.slug,
  }));
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ part: string; chapter: string }>;
}) {
  const { part, chapter: slug } = await params;
  const chapter = getChapterBySlug(CONTENT_DIR, slug);

  if (!chapter || chapter.meta.status !== "published" || chapter.meta.part !== part) {
    notFound();
  }

  const headings = extractHeadings(chapter.content);
  const adjacent = getAdjacentChapters(CONTENT_DIR, slug);
  const body = await renderMdx(chapter.content, MDX_COMPONENTS);

  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16">
      <ChapterProgress />
      <ChapterHeader
        partTitle={chapter.meta.partTitle}
        chapterNumber={chapter.meta.chapterNumber}
        title={chapter.meta.title}
        summary={chapter.meta.summary}
      />
      <ChapterNavigation headings={headings} />
      <article className="prose mt-8">{body}</article>
      <PrevNextNav adjacent={adjacent} />
      <a href="/contents/" className="block mt-8 text-p2 text-accent">
        ← Return to Table of Contents
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Create the content directory placeholder**

Run: `mkdir -p content/book && touch content/book/.gitkeep`

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (chapter page will 404 for everything until Task 20 adds real content — that's expected at this point).

- [ ] **Step 4: Commit**

```bash
git add app/book content/book/.gitkeep
git commit -m "Add chapter page route with full MDX component map"
```

---

### Task 17: Table of Contents page

**Files:**
- Create: `app/contents/page.tsx`
- Create: `components/publication/TableOfContents.tsx`

**Interfaces:**
- Consumes: `getTableOfContents` from `lib/content.ts` (Task 4).
- Produces: `TableOfContents({ parts }: { parts: TocPart[] })`, rendered by `app/contents/page.tsx`.

- [ ] **Step 1: Implement `TableOfContents`**

```tsx
import Link from "next/link";
import type { TocPart } from "@/types/content";

export function TableOfContents({ parts }: { parts: TocPart[] }) {
  return (
    <div className="space-y-12">
      {parts.map((part, partIndex) => (
        <section key={part.part}>
          <p className="text-eyebrow text-foreground-subtle">
            Part {partIndex + 1}
          </p>
          <h2 className="text-h3 mt-1">{part.partTitle}</h2>
          <ul className="mt-6 space-y-4">
            {part.chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  href={`/book/${chapter.part}/${chapter.slug}/`}
                  className="text-p1 text-accent"
                >
                  {chapter.chapterNumber}. {chapter.title}
                </Link>
                <p className="text-p2 text-foreground-secondary">
                  {chapter.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement the page**

```tsx
import path from "node:path";
import { getTableOfContents } from "@/lib/content";
import { TableOfContents } from "@/components/publication/TableOfContents";

const CONTENT_DIR = path.join(process.cwd(), "content/book");

export default function ContentsPage() {
  const parts = getTableOfContents(CONTENT_DIR);
  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16">
      <h1 className="text-h1 mb-10">Table of Contents</h1>
      <TableOfContents parts={parts} />
    </main>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/contents/page.tsx components/publication/TableOfContents.tsx
git commit -m "Add table of contents page"
```

---

### Task 18: `Header`, `Footer`, root layout wiring

**Files:**
- Create: `components/publication/Header.tsx`
- Create: `components/publication/Footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `Header()`, `Footer()`, both rendered by the root layout so they appear on every page.

- [ ] **Step 1: Implement `Header`**

```tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-6 max-w-(--width-wide) mx-auto">
      <Link href="/" className="text-h6 font-heading">
        Agentic Journey
      </Link>
      <nav className="flex gap-6 text-p2">
        <Link href="/contents/">Contents</Link>
        <Link href="/about/">About</Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Implement `Footer`**

```tsx
export function Footer() {
  return (
    <footer className="px-4 py-10 text-center text-small text-foreground-subtle">
      Agentic Journey
    </footer>
  );
}
```

- [ ] **Step 3: Wire both into the root layout**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Header } from "@/components/publication/Header";
import { Footer } from "@/components/publication/Footer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Agentic Journey",
  description: "An interactive book about building an agentic development platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/publication/Header.tsx components/publication/Footer.tsx app/layout.tsx
git commit -m "Add site Header and Footer, wire into root layout"
```

---

### Task 19: `ContinueReading` (localStorage) and Home page

**Files:**
- Create: `components/publication/ContinueReading.tsx`
- Create: `components/publication/ContinueReading.test.tsx`
- Modify: `app/book/[part]/[chapter]/page.tsx` (record the visit)
- Modify: `app/page.tsx` (full Home page)

**Interfaces:**
- Produces: `recordChapterVisit(entry: { title: string; part: string; slug: string }): void`, `getLastVisitedChapter(): { title: string; part: string; slug: string } | null` (both exported from `ContinueReading.tsx`, pure functions wrapping `localStorage`, easy to unit test directly), and `ContinueReading()` — a client component rendered on the Home page that reads the stored value on mount and renders a "Continue reading" link if one exists.

- [ ] **Step 1: Write the failing test for the storage functions**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { recordChapterVisit, getLastVisitedChapter } from "./ContinueReading";

describe("recordChapterVisit / getLastVisitedChapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing has been recorded", () => {
    expect(getLastVisitedChapter()).toBeNull();
  });

  it("returns the most recently recorded chapter", () => {
    recordChapterVisit({ title: "First", part: "foundations", slug: "first" });
    recordChapterVisit({ title: "Second", part: "foundations", slug: "second" });
    expect(getLastVisitedChapter()).toEqual({
      title: "Second",
      part: "foundations",
      slug: "second",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/publication/ContinueReading.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ContinueReading.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "agentic-journey:last-visited-chapter";

interface VisitedChapter {
  title: string;
  part: string;
  slug: string;
}

export function recordChapterVisit(entry: VisitedChapter): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function getLastVisitedChapter(): VisitedChapter | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VisitedChapter;
  } catch {
    return null;
  }
}

export function ContinueReading() {
  const [chapter, setChapter] = useState<VisitedChapter | null>(null);

  useEffect(() => {
    setChapter(getLastVisitedChapter());
  }, []);

  if (!chapter) return null;

  return (
    <Link
      href={`/book/${chapter.part}/${chapter.slug}/`}
      className="inline-block rounded-lg bg-accent text-accent-foreground px-6 py-3 text-p1"
    >
      Continue reading: {chapter.title}
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/publication/ContinueReading.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Record visits from the chapter page**

The chapter page is a server component and can't call `localStorage` directly, so create a tiny client component that fires `recordChapterVisit` on mount. Create `components/publication/RecordVisit.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { recordChapterVisit } from "./ContinueReading";

export function RecordVisit({
  title,
  part,
  slug,
}: {
  title: string;
  part: string;
  slug: string;
}) {
  useEffect(() => {
    recordChapterVisit({ title, part, slug });
  }, [title, part, slug]);
  return null;
}
```

In `app/book/[part]/[chapter]/page.tsx`, add the import alongside the existing `ChapterProgress` import:

```tsx
import { ChapterProgress } from "@/components/publication/ChapterProgress";
import { RecordVisit } from "@/components/publication/RecordVisit";
```

Then render it immediately after `<ChapterProgress />` in the returned JSX:

```tsx
    <main className="max-w-(--width-reading) mx-auto px-4 py-16">
      <ChapterProgress />
      <RecordVisit
        title={chapter.meta.title}
        part={chapter.meta.part}
        slug={chapter.meta.slug}
      />
      <ChapterHeader
```

- [ ] **Step 6: Implement the full Home page**

```tsx
import path from "node:path";
import Link from "next/link";
import { getTableOfContents } from "@/lib/content";
import { ContinueReading } from "@/components/publication/ContinueReading";

const CONTENT_DIR = path.join(process.cwd(), "content/book");

export default function HomePage() {
  const parts = getTableOfContents(CONTENT_DIR);
  const featuredChapters = parts.flatMap((part) => part.chapters).slice(0, 3);

  return (
    <main className="max-w-(--width-wide) mx-auto px-4 py-16">
      <section className="text-center py-20">
        <h1 className="text-h1">Agentic Journey</h1>
        <p className="text-lead text-foreground-secondary mt-4 max-w-(--width-reading) mx-auto">
          An interactive book about building an agentic development platform —
          one system at a time.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/contents/" className="rounded-lg bg-accent text-accent-foreground px-6 py-3 text-p1">
            Start Reading
          </Link>
          <Link href="/contents/" className="rounded-lg border border-border px-6 py-3 text-p1">
            View Table of Contents
          </Link>
        </div>
        <div className="mt-6">
          <ContinueReading />
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-h3 mb-6">Featured Chapters</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredChapters.map((chapter) => (
            <Link
              key={chapter.slug}
              href={`/book/${chapter.part}/${chapter.slug}/`}
              className="block rounded-lg border border-border p-6"
            >
              <p className="text-eyebrow text-foreground-subtle">
                {chapter.part}
              </p>
              <h3 className="text-h6 mt-2">{chapter.title}</h3>
              <p className="text-p2 text-foreground-secondary mt-2">
                {chapter.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: succeeds (Home page will show 0 featured chapters until Task 20 adds published content — that's expected here).

- [ ] **Step 8: Commit**

```bash
git add components/publication/ContinueReading.tsx components/publication/ContinueReading.test.tsx components/publication/RecordVisit.tsx app/book/[part]/[chapter]/page.tsx app/page.tsx
git commit -m "Add continue-reading storage and full Home page"
```

---

### Task 20: About page and appendix route stub

**Files:**
- Create: `content/pages/about.mdx`
- Create: `app/about/page.tsx`
- Create: `app/appendix/[slug]/page.tsx`

**Interfaces:**
- Produces: static `/about/` route rendering `content/pages/about.mdx`; static `/appendix/[slug]/` route wired with `generateStaticParams` returning `[]` (no appendix content yet, per the design doc's "scaffolded, empty initially" — this keeps the route working under static export without inventing appendix content).

- [ ] **Step 1: Write `content/pages/about.mdx`**

```mdx
# About This Book

This is a work-in-progress interactive book about building an agentic
development platform — what worked, what didn't, and how the tooling
evolved along the way.

More about the author and the project will go here.
```

- [ ] **Step 2: Implement the About page**

```tsx
import fs from "node:fs";
import path from "node:path";
import { renderMdx } from "@/lib/mdx";

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), "content/pages/about.mdx");
  const source = fs.readFileSync(filePath, "utf-8");
  const body = await renderMdx(source, {});

  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16 prose">
      {body}
    </main>
  );
}
```

- [ ] **Step 3: Implement the appendix route stub**

```tsx
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [];
}

export default function AppendixPage() {
  notFound();
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds; `out/about/index.html` exists.

- [ ] **Step 5: Commit**

```bash
git add content/pages/about.mdx app/about/page.tsx app/appendix
git commit -m "Add About page and appendix route stub"
```

---

### Task 21: Placeholder chapter content for all four parts

**Files:**
- Create 12 chapter MDX files under `content/book/`:
  - `content/book/the-beginning/01-introduction.mdx`
  - `content/book/the-beginning/02-the-first-agent.mdx`
  - `content/book/the-beginning/03-dogfooding-the-system.mdx`
  - `content/book/the-platform-evolves/01-ask-product.mdx`
  - `content/book/the-platform-evolves/02-bitbot-and-evals.mdx`
  - `content/book/the-platform-evolves/03-fastlane.mdx`
  - `content/book/the-shared-system/01-reusable-tools.mdx`
  - `content/book/the-shared-system/02-context-and-evidence.mdx`
  - `content/book/the-shared-system/03-organizational-learning.mdx`
  - `content/book/what-changed/01-the-ideas-factory.mdx`
  - `content/book/what-changed/02-human-judgment.mdx`
  - `content/book/what-changed/03-lessons-learned.mdx`
- Delete: `content/book/.gitkeep`

**Interfaces:**
- Consumes: the full frontmatter shape from `ChapterMeta` (Task 3) — every file below must match it exactly, including `previous`/`next` chaining across chapters (and across parts, so `getAdjacentChapters` continues to work end-to-end).
- This task also determines which three chapters carry the required proof examples per the design doc: `01-ask-product.mdx` gets the `<AnimatedFlow />` (already wired to `askProductFlow` in the MDX component map), `02-bitbot-and-evals.mdx` gets a `<MermaidDiagram>`, and `02-the-first-agent.mdx` gets a `<VideoEmbed>`. These three plus `01-introduction.mdx` ship as `status: published`; the remaining eight ship as `status: draft` (per the design doc, this keeps the generated Table of Contents populated with real content without requiring every placeholder chapter to be "finished").

- [ ] **Step 1: Write `content/book/the-beginning/01-introduction.mdx`**

```mdx
---
title: Introduction
slug: introduction
part: the-beginning
partTitle: The Beginning
chapterNumber: 1
summary: What this book covers, and why it's told as an interactive book rather than a blog series.
status: published
previous: null
next: the-first-agent
---

# Introduction

This book is about how an agentic development platform came to be —
one system, one lesson, one mistake at a time.

## Why a Book, and Why Interactive

A blog post format flattens systems into paragraphs. Some of what
happened here is easier to show than to describe.

<Callout type="context">
  This is placeholder content. The real narrative will replace this
  once the site's structure is in place.
</Callout>
```

- [ ] **Step 2: Write `content/book/the-beginning/02-the-first-agent.mdx`**

```mdx
---
title: The First Agent
slug: the-first-agent
part: the-beginning
partTitle: The Beginning
chapterNumber: 2
summary: The earliest version of the system, and what it could and couldn't do.
status: published
previous: introduction
next: dogfooding-the-system
---

# The First Agent

## What It Could Do

Placeholder narrative describing the first agent's capabilities.

<VideoEmbed
  src="/videos/placeholders/first-agent-demo.mp4"
  title="Early demo of the first agent"
  description="Placeholder footage — will be replaced with a real recording."
/>

## What It Couldn't Do Yet

More placeholder narrative.
```

- [ ] **Step 3: Write `content/book/the-beginning/03-dogfooding-the-system.mdx`**

```mdx
---
title: Dogfooding the System
slug: dogfooding-the-system
part: the-beginning
partTitle: The Beginning
chapterNumber: 3
summary: What happened when the team started using the system on its own work.
status: draft
previous: the-first-agent
next: ask-product
---

# Dogfooding the System

Placeholder chapter — draft.
```

- [ ] **Step 4: Write `content/book/the-platform-evolves/01-ask-product.mdx`**

```mdx
---
title: Ask Product
slug: ask-product
part: the-platform-evolves
partTitle: The Platform Evolves
chapterNumber: 1
summary: How the Ask Product Agent turned distributed product knowledge into a reusable system.
status: published
previous: dogfooding-the-system
next: bitbot-and-evals
---

# Ask Product

## Why We Built It

Placeholder narrative about the origin of Ask Product.

<WideSection>
  <AnimatedFlow />
</WideSection>

## How It Routes a Question

More placeholder narrative walking through the flow above.

<TechnicalDetail title="View routing logic">
  ```json
  {
    "status": "pass"
  }
  ```
</TechnicalDetail>
```

- [ ] **Step 5: Write `content/book/the-platform-evolves/02-bitbot-and-evals.mdx`**

```mdx
---
title: BitBot and Evals
slug: bitbot-and-evals
part: the-platform-evolves
partTitle: The Platform Evolves
chapterNumber: 2
summary: How automated evaluation became part of the response pipeline.
status: published
previous: ask-product
next: fastlane
---

# BitBot and Evals

## The Evaluation Loop

Placeholder narrative.

<MermaidDiagram chart={`
flowchart LR
  Response --> BitBot
  BitBot --> Pass
  BitBot --> Fail
  Fail --> HumanReview
`} />

## Why Human Review Still Matters

More placeholder narrative.
```

- [ ] **Step 6: Write `content/book/the-platform-evolves/03-fastlane.mdx`**

```mdx
---
title: Fastlane
slug: fastlane
part: the-platform-evolves
partTitle: The Platform Evolves
chapterNumber: 3
summary: A faster intake path for a narrower class of questions.
status: draft
previous: bitbot-and-evals
next: reusable-tools
---

# Fastlane

Placeholder chapter — draft.
```

- [ ] **Step 7: Write the remaining six draft chapters**

`content/book/the-shared-system/01-reusable-tools.mdx`:
```mdx
---
title: Reusable Tools
slug: reusable-tools
part: the-shared-system
partTitle: The Shared System
chapterNumber: 1
summary: The tooling that started showing up in more than one agent.
status: draft
previous: fastlane
next: context-and-evidence
---

# Reusable Tools

Placeholder chapter — draft.
```

`content/book/the-shared-system/02-context-and-evidence.mdx`:
```mdx
---
title: Context and Evidence
slug: context-and-evidence
part: the-shared-system
partTitle: The Shared System
chapterNumber: 2
summary: How agents learned to show their work.
status: draft
previous: reusable-tools
next: organizational-learning
---

# Context and Evidence

Placeholder chapter — draft.
```

`content/book/the-shared-system/03-organizational-learning.mdx`:
```mdx
---
title: Organizational Learning
slug: organizational-learning
part: the-shared-system
partTitle: The Shared System
chapterNumber: 3
summary: What the org learned from watching agents work.
status: draft
previous: context-and-evidence
next: the-ideas-factory
---

# Organizational Learning

Placeholder chapter — draft.
```

`content/book/what-changed/01-the-ideas-factory.mdx`:
```mdx
---
title: The Ideas Factory
slug: the-ideas-factory
part: what-changed
partTitle: What Changed
chapterNumber: 1
summary: Where new agent ideas started coming from.
status: draft
previous: organizational-learning
next: human-judgment
---

# The Ideas Factory

Placeholder chapter — draft.
```

`content/book/what-changed/02-human-judgment.mdx`:
```mdx
---
title: Human Judgment
slug: human-judgment
part: what-changed
partTitle: What Changed
chapterNumber: 2
summary: What stayed a human's job, and why.
status: draft
previous: the-ideas-factory
next: lessons-learned
---

# Human Judgment

Placeholder chapter — draft.
```

`content/book/what-changed/03-lessons-learned.mdx`:
```mdx
---
title: Lessons Learned
slug: lessons-learned
part: what-changed
partTitle: What Changed
chapterNumber: 3
summary: What we'd do differently, and what we wouldn't.
status: draft
previous: human-judgment
next: null
---

# Lessons Learned

Placeholder chapter — draft.
```

- [ ] **Step 8: Remove the placeholder gitkeep**

Run: `rm content/book/.gitkeep`

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: succeeds; `out/book/the-beginning/introduction/index.html`, `out/book/the-beginning/the-first-agent/index.html`, `out/book/the-platform-evolves/ask-product/index.html`, and `out/book/the-platform-evolves/bitbot-and-evals/index.html` all exist. Draft chapter paths (e.g. `out/book/the-beginning/dogfooding-the-system/`) do NOT exist.

- [ ] **Step 10: Manual verification of the three proof examples**

Run: `npm run dev`, then visit:
- `http://localhost:3000/book/the-beginning/the-first-agent/` — confirm the video player renders and controls work (the placeholder MP4 file doesn't exist yet, so playback itself will error, but the `<video>` element and controls must render correctly)
- `http://localhost:3000/book/the-platform-evolves/bitbot-and-evals/` — confirm the Mermaid diagram renders as an SVG flowchart
- `http://localhost:3000/book/the-platform-evolves/ask-product/` — confirm the AnimatedFlow renders, and Play/Next/Previous/Restart all move through the 7 steps correctly, highlighting the right node and step text at each one

- [ ] **Step 11: Commit**

```bash
git add content/book
git commit -m "Add placeholder chapter content for all four parts"
```

---

### Task 22: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a workflow triggered on push to `main` that builds the static export and deploys it to GitHub Pages via `actions/upload-pages-artifact` + `actions/deploy-pages` (per the design doc — this bypasses Jekyll's `_next/` stripping, unlike branch-based Pages deploys).

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deploy workflow"
```

- [ ] **Step 3: Push and enable Pages (requires user action — flag this rather than doing it silently)**

This step needs the user to push the branch and, in the repo's Settings → Pages, set the source to "GitHub Actions" (one-time setup, only possible via the GitHub UI or `gh api`, and it changes repo configuration — confirm with the user before running `git push` or any `gh api` call against repo settings).

---

## Final Full-Build Verification

After Task 22, run the complete verification pass before considering v1 done:

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all tests pass, no type errors, and `npm run build` produces `out/` with:
- `out/index.html` (Home)
- `out/contents/index.html` (Table of Contents)
- `out/about/index.html` (About)
- `out/book/*/*/index.html` for all 4 published chapters, and none for the 8 draft chapters
- `out/_next/` present (this is the directory Jekyll would strip — confirms the Actions-based deploy path in Task 22 is the right one)
