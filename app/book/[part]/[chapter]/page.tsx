import { notFound } from "next/navigation";
import {
  getPublishedChapters,
  getChapterBySlug,
  getAdjacentChapters,
  getFlatChapterList,
} from "@/lib/content";
import { ChapterSidebar } from "@/components/publication/ChapterSidebar";
import { extractHeadings } from "@/lib/headings";
import { renderMdx } from "@/lib/mdx";
import { ChapterHeader } from "@/components/publication/ChapterHeader";
import { ChapterNavigation } from "@/components/publication/ChapterNavigation";
import { PrevNextNav } from "@/components/publication/PrevNextNav";
import { ChapterProgress } from "@/components/publication/ChapterProgress";
import { RecordVisit } from "@/components/publication/RecordVisit";
import { Callout } from "@/components/content/Callout";
import { Quote } from "@/components/content/Quote";
import { CodeBlock } from "@/components/content/CodeBlock";
import { TechnicalDetail } from "@/components/content/TechnicalDetail";
import { WideSection } from "@/components/content/WideSection";
import { FullBleedSection } from "@/components/content/FullBleedSection";
import { VideoEmbed } from "@/components/media/VideoEmbed";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import { AnimatedFlow } from "@/components/diagrams/AnimatedFlow";
import { askProductFlow } from "@/content/diagrams/ask-product-flow";
import { CONTENT_DIR } from "@/lib/contentDir";

const MDX_COMPONENTS = {
  Callout,
  Quote,
  CodeBlock,
  TechnicalDetail,
  WideSection,
  FullBleedSection,
  VideoEmbed,
  MermaidDiagram,
  AnimatedFlow: () => <AnimatedFlow data={askProductFlow} />,
};

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
  const chapter = getChapterBySlug(CONTENT_DIR, slug);

  if (!chapter || chapter.meta.status !== "published" || chapter.meta.part !== part) {
    notFound();
  }

  const headings = extractHeadings(chapter.content);
  const adjacent = getAdjacentChapters(CONTENT_DIR, slug);
  const chapters = getFlatChapterList(CONTENT_DIR);
  const body = await renderMdx(chapter.content, MDX_COMPONENTS);

  return (
    <div className="max-w-(--width-wide) mx-auto px-4 py-16 flex flex-col lg:flex-row lg:gap-12">
      <ChapterSidebar chapters={chapters} currentSlug={slug} />
      <main className="max-w-(--width-reading) w-full">
        <ChapterProgress />
        <RecordVisit
          title={chapter.meta.title}
          part={chapter.meta.part}
          slug={chapter.meta.slug}
        />
        <ChapterHeader
          partTitle={chapter.meta.partTitle}
          chapterNumber={chapter.meta.chapterNumber}
          title={chapter.meta.title}
          summary={chapter.meta.summary}
        />
        <ChapterNavigation headings={headings} />
        <article className="prose prose-invert mt-8">{body}</article>
        <PrevNextNav adjacent={adjacent} />
      </main>
    </div>
  );
}
