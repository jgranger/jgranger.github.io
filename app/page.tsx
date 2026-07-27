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
