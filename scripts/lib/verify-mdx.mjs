// Compiles every generated .mdx file's body through the exact same MDX
// engine/plugins the site uses (lib/mdx.tsx) to catch syntax errors —
// things like an escaped quote inside a JSX attribute, which is invalid
// JSX/MDX even though it's valid JS — before they ever reach a page.
//
// This exists because that exact bug shipped into a chapter draft
// unnoticed: a VideoEmbed title attribute written with `\"` escaping,
// which next-mdx-remote only fails on at request time, in the browser,
// with a cryptic parser error. Never again treat "the code compiled"
// as proof that content compiles — content has its own compiler and
// must be checked with it, every time.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compile } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";

function findMdxFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findMdxFiles(fullPath));
    } else if (entry.name.endsWith(".mdx")) {
      found.push(fullPath);
    }
  }
  return found;
}

/**
 * Compiles every .mdx file under `dir`. Returns a list of
 * { file, error } for any that fail to compile. Empty array means
 * everything is valid.
 */
export async function verifyMdxDir(dir) {
  const failures = [];
  for (const filePath of findMdxFiles(dir)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { content } = matter(raw);
    try {
      await compile(content, { rehypePlugins: [rehypeSlug] });
    } catch (error) {
      failures.push({ file: filePath, error });
    }
  }
  return failures;
}

/** Prints failures and returns true if there were any (so callers can exit(1)). */
export function reportMdxFailures(failures, rootDir) {
  if (failures.length === 0) return false;
  console.error(`\n✗ ${failures.length} chapter(s) failed to compile:\n`);
  for (const { file, error } of failures) {
    console.error(`  ${path.relative(rootDir, file)}`);
    console.error(`    ${error.message.split("\n")[0]}\n`);
  }
  return true;
}
