import fs from "node:fs";
import path from "node:path";
import { renderMdx } from "@/lib/mdx";

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), "content/pages/about.mdx");
  const source = fs.readFileSync(filePath, "utf-8");
  const body = await renderMdx(source, {});

  return (
    <main className="max-w-(--width-reading) mx-auto px-4 py-16 prose">
      {body}
    </main>
  );
}
