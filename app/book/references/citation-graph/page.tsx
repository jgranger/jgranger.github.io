import { CitationGraph } from "@/components/citations/CitationGraph";
import { ChapterSidebar } from "@/components/publication/ChapterSidebar";
import { ChapterHeader } from "@/components/publication/ChapterHeader";
import { PrevNextNav } from "@/components/publication/PrevNextNav";
import { ChapterProgress } from "@/components/publication/ChapterProgress";
import { RecordVisit } from "@/components/publication/RecordVisit";
import { getFlatChapterList } from "@/lib/content";
import { CONTENT_DIR } from "@/lib/contentDir";

export default function CitationGraphChapter() {
  const bookChapters = getFlatChapterList(CONTENT_DIR);
  const lookingForward = bookChapters.find((chapter) => chapter.slug === "looking-forward") ?? null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:flex lg:gap-12 lg:py-16">
      <ChapterSidebar chapters={bookChapters} currentSlug="citation-graph" />
      <main className="min-w-0 w-full">
        <ChapterProgress />
        <RecordVisit
          title="Citation Graph"
          part="references"
          slug="citation-graph"
        />
        <div className="max-w-(--width-reading)">
          <ChapterHeader
            partTitle="References"
            title="Citation Graph"
            summary="The ideas in this book did not develop in isolation. This graph shows where our production experience intersects with research, writing and independent discoveries made elsewhere."
          />
          <div className="prose prose-invert mb-10">
            <p>
              The most interesting connections are the ones we did not start from. We built toward them through production problems, failures, experiments and conversations, then discovered people working from very different directions had arrived at remarkably similar ideas.
            </p>
            <p>
              Follow the graph outward. Each node opens the paper, article, talk or artifact behind it. The point is not to prove that one path was first. It is to make the relationships visible.
            </p>
          </div>
        </div>
        <CitationGraph />
        <div className="max-w-(--width-reading)">
          <PrevNextNav adjacent={{ previous: lookingForward, next: null }} />
        </div>
      </main>
    </div>
  );
}
