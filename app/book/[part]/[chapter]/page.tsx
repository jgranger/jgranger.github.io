import path from "node:path";
import { notFound } from "next/navigation";
import {
  getPublishedChapters,
  getChapterBySlug,
  getAdjacentChapters,
} from "@/lib/content";
import { extractHeadings } from "@/lib/headings";
import { renderMdx } from "@/lib/mdx";
import { ChapterHeader } from "@/components/publication/ChapterHeader";
import { ChapterNavigation } from "@/components/publication/ChapterNavigation";
import { PrevNextNav } from "@/components/publication/PrevNextNav";
import { ChapterProgress } from "@/components/publication/ChapterProgress";
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

const CONTENT_DIR = path.join(process.cwd(), "content/book");

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
  const body = await renderMdx(chapter.content, MDX_COMPONENTS);

  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16">
      <ChapterProgress />
      <ChapterHeader
        partTitle={chapter.meta.partTitle}
        chapterNumber={chapter.meta.chapterNumber}
        title={chapter.meta.title}
        summary={chapter.meta.summary}
      />
      <ChapterNavigation headings={headings} />
      <article className="prose mt-8">{body}</article>
      <PrevNextNav adjacent={adjacent} />
      <a href="/contents/" className="block mt-8 text-p2 text-accent">
        ← Return to Table of Contents
      </a>
    </main>
  );
}
