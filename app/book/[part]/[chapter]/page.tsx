import { getPublishedChapters } from "@/lib/content";
import { ChapterView } from "@/components/publication/ChapterView";
import { CONTENT_DIR } from "@/lib/contentDir";

// Required alongside generateStaticParams for output: export — without it,
// Next's export validator can reject this route as "missing
// generateStaticParams()" specifically when the list it returns is empty
// (no chapters published yet), even though the function is present.
export const dynamicParams = false;

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
  return <ChapterView part={part} slug={slug} />;
}
