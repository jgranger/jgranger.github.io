import fs from "node:fs";
import Link from "next/link";
import path from "node:path";
import { notFound } from "next/navigation";
import { ChapterSidebar } from "@/components/publication/ChapterSidebar";
import { getFlatChapterList } from "@/lib/content";
import { CONTENT_DIR } from "@/lib/contentDir";
import { renderMdx } from "@/lib/mdx";

export default async function AcknowledgmentsPage() {
  const sourcePath = path.join(
    process.cwd(),
    "docs/private/chapters/00-acknowledgments.md"
  );

  if (!fs.existsSync(sourcePath)) {
    notFound();
  }

  const body = await renderMdx(fs.readFileSync(sourcePath, "utf-8"), {});
  const chapters = getFlatChapterList(CONTENT_DIR);

  return (
    <div className="max-w-(--width-wide) mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:flex lg:justify-center lg:gap-16 lg:py-16">
      <ChapterSidebar chapters={chapters} currentSlug="acknowledgments" />
      <main className="min-w-0 w-full flex-1 max-w-(--width-column)">
        <div className="max-w-(--width-measure)">
          <h1 className="text-h1">Acknowledgments</h1>
        </div>
        <article className="prose prose-invert mt-8">{body}</article>
        <nav aria-label="Reading order" className="mt-12 flex max-w-(--width-measure) flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <Link href="/dedication/" className="block min-h-12 rounded-lg border border-border px-4 py-3 text-p1 text-accent">
            ← Dedication
          </Link>
          <Link href="/book/one-problem-worth-solving/" className="block min-h-12 rounded-lg border border-border px-4 py-3 text-p1 text-accent">
            One Problem Worth Solving →
          </Link>
        </nav>
      </main>
    </div>
  );
}
