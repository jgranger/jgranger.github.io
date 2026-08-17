import Link from "next/link";
import type { TocPart } from "@/types/content";

const ACCENT_ROTATION = ["", "glow-card--violet", "glow-card--magenta"];

export function TableOfContents({ parts }: { parts: TocPart[] }) {
  let cardIndex = 0;
  return (
    <div className="space-y-12">
      {parts.map((part, partIndex) => (
        <section key={part.part}>
          <p className="text-eyebrow text-foreground-subtle">
            Part {partIndex + 1}
          </p>
          <h2 className="text-h3 mt-1">{part.partTitle}</h2>
          <ul className="mt-6 space-y-4">
            {part.chapters.map((chapter) => {
              const accentClass = ACCENT_ROTATION[cardIndex % ACCENT_ROTATION.length];
              cardIndex += 1;
              return (
                <li key={chapter.slug} className={`glow-card ${accentClass} p-5`}>
                  <Link
                    href={`/book/${chapter.part}/${chapter.slug}/`}
                    className="text-h6 font-heading text-foreground"
                  >
                    {chapter.chapterNumber}. {chapter.title}
                  </Link>
                  <p className="text-p2 text-foreground-subtle mt-1">
                    {chapter.summary}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
