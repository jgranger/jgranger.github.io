import { getFlatChapterList } from "@/lib/content";
import { ChapterView } from "@/components/publication/ChapterView";
import { CONTENT_DIR } from "@/lib/contentDir";

// The home page IS chapter 1, not a separate landing page pointing at it —
// there's nothing else here to "start reading" from.
export default function HomePage() {
  const firstChapter = getFlatChapterList(CONTENT_DIR)[0];

  if (!firstChapter) return null;

  return <ChapterView part={firstChapter.part} slug={firstChapter.slug} />;
}
