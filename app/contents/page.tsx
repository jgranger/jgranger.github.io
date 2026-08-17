import { getTableOfContents } from "@/lib/content";
import { TableOfContents } from "@/components/publication/TableOfContents";
import { CONTENT_DIR } from "@/lib/contentDir";

export default function ContentsPage() {
  const parts = getTableOfContents(CONTENT_DIR);
  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16">
      <h1 className="text-h1 mb-10">Table of Contents</h1>
      <TableOfContents parts={parts} />
    </main>
  );
}
