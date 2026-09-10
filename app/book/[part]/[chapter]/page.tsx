import { getPublishedChapters } from "@/lib/content";
import { ChapterView } from "@/components/publication/ChapterView";
import { CONTENT_DIR } from "@/lib/contentDir";

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
