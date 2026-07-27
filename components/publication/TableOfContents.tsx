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
