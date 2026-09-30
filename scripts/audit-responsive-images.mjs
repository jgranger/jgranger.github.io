import fs from "node:fs";
import path from "node:path";
import { generateDiagramVariants } from "./lib/diagram-variants.mjs";

const root = path.resolve(process.argv[2] || "docs/private");
generateDiagramVariants(root);
const files = fs.readdirSync(root);
const references = new Map();
for (const file of fs.readdirSync(path.join(root, "chapters")).filter(name => name.endsWith(".md"))) {
  const content = fs.readFileSync(path.join(root, "chapters", file), "utf8");
  for (const match of content.matchAll(/!\[\[([^\]|]+)(?:\|\d+)?\]\]|!\[[^\]]*\]\(([^)]+)\)/g)) {
    const source = match[1] || match[2];
    if (!/\.(png|jpe?g|webp|svg)$/i.test(source)) continue;
    const chapters = references.get(source) || [];
    if (!chapters.includes(file)) chapters.push(file);
    references.set(source, chapters);
  }
}
const report = [...references].map(([source, chapters]) => {
  const stem = source.slice(0, -path.extname(source).length);
  return { source, chapters, phone: files.find(name => name.startsWith(`${stem}.phone.`)) || null, desktop: files.find(name => name.startsWith(`${stem}.desktop.`)) || null, tablet: files.find(name => name.startsWith(`${stem}.tablet.`)) || null };
});
console.log(JSON.stringify(report, null, 2));
