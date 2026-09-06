import fs from "node:fs";
import path from "node:path";
import { renderMdx } from "@/lib/mdx";

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), "content/pages/about.mdx");
  const source = fs.readFileSync(filePath, "utf-8");
  const body = await renderMdx(source, {});

  return (
    <main className="prose mx-auto max-w-(--width-reading) px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      {body}
    </main>
  );
}
