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
