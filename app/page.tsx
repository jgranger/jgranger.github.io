import { getFlatChapterList } from "@/lib/content";
import { ChapterView } from "@/components/publication/ChapterView";
import { CONTENT_DIR } from "@/lib/contentDir";

// The home page IS chapter 1 once a real chapter is published — there's
// nothing else here to "start reading" from. Until then, this must never
// fall back to placeholder/scaffold chapter content: a public visitor
// seeing fake chapters and filler text is worse than seeing nothing.
export default function HomePage() {
  const firstChapter = getFlatChapterList(CONTENT_DIR)[0];

  if (!firstChapter) {
    return (
      <main className="max-w-(--width-wide) mx-auto px-4 py-24 sm:px-6 text-center">
        <h1 className="text-h1">Agentic Journey</h1>
        <p className="text-lead text-foreground-secondary mt-4 max-w-(--width-reading) mx-auto">
          This book is being written. Check back soon.
        </p>
      </main>
    );
  }

  return <ChapterView part={firstChapter.part} slug={firstChapter.slug} />;
}
