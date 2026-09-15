import { getPublishedChapters } from "@/lib/content";
import { ChapterView } from "@/components/publication/ChapterView";
import { CONTENT_DIR } from "@/lib/contentDir";

export const dynamicParams = false;

export function generateStaticParams() {
  const chapters = getPublishedChapters(CONTENT_DIR).map((chapter) => ({
    chapter: chapter.meta.slug,
  }));
  // output: export hard-requires at least one pre-rendered path for a
  // dynamic route — Next throws "missing generateStaticParams()" for a
  // genuinely empty result, even though the function is present (see
  // next/dist/build/index.js's hasGenerateStaticParams check, keyed on
  // prerenderedRoutes.length > 0). This placeholder satisfies that
  // requirement without ever showing content: nothing links to it, and
  // ChapterView's own notFound() guard 404s any slug that isn't a real
  // published chapter, including this one.
  return chapters.length > 0 ? chapters : [{ chapter: "_none" }];
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: slug } = await params;
  return <ChapterView slug={slug} />;
}
