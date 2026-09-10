import { notFound } from "next/navigation";
import {
  getChapterBySlug,
  getAdjacentChapters,
  getFlatChapterList,
} from "@/lib/content";
import { ChapterSidebar } from "@/components/publication/ChapterSidebar";
import { renderMdx } from "@/lib/mdx";
import { ChapterHeader } from "@/components/publication/ChapterHeader";
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
import { GalaxyComparison, GoogleGalaxy, AgenticGalaxy } from "@/components/diagrams/GalaxyComparison";
import { askProductFlow } from "@/content/diagrams/ask-product-flow";
import { CONTENT_DIR } from "@/lib/contentDir";
import type { TocEntry } from "@/types/content";

const CITATION_CHAPTER: TocEntry = {
  title: "Citation Graph",
  slug: "citation-graph",
  part: "references",
  chapterNumber: 12,
  summary: "Follow the ideas in the book back through the research, production experience and independent convergence behind them.",
  status: "published",
};

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
  GalaxyComparison,
  GoogleGalaxy,
  AgenticGalaxy,
};

/**
 * Renders a chapter's full reading view — sidebar, header, body, prev/next
 * nav. Shared between the actual /book/[part]/[chapter] route and the home
 * page, which renders the first chapter directly rather than a separate
 * landing page.
 */
export async function ChapterView({
  part,
  slug,
}: {
  part: string;
  slug: string;
}) {
  const chapter = getChapterBySlug(CONTENT_DIR, slug);

  if (!chapter || chapter.meta.status !== "published" || chapter.meta.part !== part) {
    notFound();
  }

  const adjacent = getAdjacentChapters(CONTENT_DIR, slug);
  if (slug === "looking-forward") {
    adjacent.next = CITATION_CHAPTER;
  }

  const chapters = getFlatChapterList(CONTENT_DIR);
  const chapterNumber =
    chapters.find((c) => c.slug === slug)?.chapterNumber ??
    chapter.meta.chapterNumber;
  const body = await renderMdx(chapter.content, MDX_COMPONENTS);

  return (
    <div className="max-w-(--width-wide) mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:flex lg:gap-12 lg:py-16">
      <ChapterSidebar chapters={chapters} currentSlug={slug} />
      <main className="min-w-0 max-w-(--width-reading) w-full">
        <ChapterProgress />
        <RecordVisit
          title={chapter.meta.title}
          part={chapter.meta.part}
          slug={chapter.meta.slug}
        />
        <ChapterHeader
          partTitle={chapter.meta.partTitle}
          chapterNumber={chapterNumber}
          title={chapter.meta.title}
          summary={chapter.meta.summary}
        />
        <article className="prose prose-invert mt-8">{body}</article>
        <PrevNextNav adjacent={adjacent} />
      </main>
    </div>
  );
}
