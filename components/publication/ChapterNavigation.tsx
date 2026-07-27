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
