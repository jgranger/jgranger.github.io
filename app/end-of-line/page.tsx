import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMdx } from "@/lib/mdx";

// Not linked from navigation, the table of contents, or any sitemap.
// Reachable only via the Konami code (see components/KonamiListener.tsx).
const BONUS_FILE = path.join(
  process.cwd(),
  "content/bonus/end-of-line.mdx"
);

export const metadata = {
  title: "End of Line",
};

export default async function EndOfLinePage() {
  const raw = fs.readFileSync(BONUS_FILE, "utf-8");
  const { content, data } = matter(raw);
  const body = await renderMdx(content, {});

  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16">
      <header className="mb-10">
        <h1 className="text-h1 mt-2">{data.title}</h1>
      </header>
      <article className="prose prose-invert mt-8">{body}</article>
    </main>
  );
}
