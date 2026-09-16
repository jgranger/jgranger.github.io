import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { ChapterSidebar } from "@/components/publication/ChapterSidebar";
import { getFlatChapterList } from "@/lib/content";
import { CONTENT_DIR } from "@/lib/contentDir";
import { renderMdx } from "@/lib/mdx";

export default async function DedicationPage() {
  const sourcePath = path.join(
    process.cwd(),
    "docs/private/chapters/00-dedication.md"
  );

  if (!fs.existsSync(sourcePath)) {
    notFound();
  }

  const body = await renderMdx(fs.readFileSync(sourcePath, "utf-8"), {});
  const chapters = getFlatChapterList(CONTENT_DIR);

  return (
    <div className="max-w-(--width-wide) mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:flex lg:justify-center lg:gap-16 lg:py-16">
      <ChapterSidebar chapters={chapters} currentSlug="dedication" />
      <main className="min-w-0 w-full flex-1 max-w-(--width-column)">
        <div className="max-w-(--width-measure)">
          <h1 className="text-h1">Dedication</h1>
        </div>
        <article className="prose prose-invert mt-8">{body}</article>
      </main>
    </div>
  );
}
