import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMdx } from "@/lib/mdx";
import { getFlatChapterList } from "@/lib/content";
import { ChapterSidebar } from "@/components/publication/ChapterSidebar";
import { CONTENT_DIR } from "@/lib/contentDir";

// Not linked from navigation, the table of contents, or any sitemap.
// Reachable only by winning the mini-game at the end of "For the Users"
// (see components/bonus/PlayGate.tsx and GolfGame.tsx).
const BONUS_FILE = path.join(
  process.cwd(),
  "content/bonus/full-access.mdx"
);

export const metadata = {
  title: "Full Access",
};

export default async function FullAccessPage() {
  const raw = fs.readFileSync(BONUS_FILE, "utf-8");
  const { content, data } = matter(raw);
  const body = await renderMdx(content, {});
  const chapters = getFlatChapterList(CONTENT_DIR);

  return (
    <div className="max-w-(--width-wide) mx-auto px-4 py-16 flex flex-col lg:flex-row lg:gap-12">
      <ChapterSidebar chapters={chapters} currentSlug="full-access" />
      <main className="max-w-(--width-reading) w-full">
        <header className="mb-10">
          <h1 className="text-h1 mt-2">{data.title}</h1>
        </header>
        <article className="prose prose-invert mt-8">{body}</article>
      </main>
    </div>
  );
}
