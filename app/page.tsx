import Link from "next/link";
import { getFlatChapterList } from "@/lib/content";
import { ContinueReading } from "@/components/publication/ContinueReading";
import { CONTENT_DIR } from "@/lib/contentDir";

export default function HomePage() {
  const firstChapter = getFlatChapterList(CONTENT_DIR)[0];

  return (
    <main className="home-page max-w-(--width-wide) mx-auto px-3 sm:px-6 py-3 sm:py-8">
      <section className="hero-grid flex flex-col items-center justify-center text-center px-5 py-12 sm:px-8 sm:py-20">
        <h1 className="text-h1">Agentic Journey</h1>
        <p className="text-lead text-foreground-secondary mt-4 max-w-(--width-reading) mx-auto">
          An interactive book about building an agentic development platform —
          one system at a time.
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          {firstChapter && (
            <Link
              href={`/book/${firstChapter.part}/${firstChapter.slug}/`}
              className="min-h-12 rounded-lg bg-accent text-accent-foreground px-6 py-3 text-center text-p1"
            >
              Start Reading
            </Link>
          )}
        </div>
        <div className="mt-3 w-full sm:mt-6 sm:w-auto">
          <ContinueReading />
        </div>
      </section>
    </main>
  );
}
