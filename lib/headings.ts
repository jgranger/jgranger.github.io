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
