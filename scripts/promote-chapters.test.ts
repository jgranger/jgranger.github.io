import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { CHAPTERS } from "./lib/chapters.mjs";

let directory: string;

afterEach(() => {
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

describe("chapter promotion", () => {
  it("publishes explicit preview image references with their production assets", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "promote-chapters-"));
    const privateDir = path.join(directory, "docs/private");
    const chaptersDir = path.join(privateDir, "chapters");
    fs.mkdirSync(chaptersDir, { recursive: true });
    const image = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />';
    fs.writeFileSync(path.join(privateDir, "exchange.svg"), image);
    const source = [
      '<img src="/preview-images/exchange.svg" alt="Exchange" />',
      "<img src='/preview-images/exchange.svg' alt='Reply' />",
      '<ZoomableImage src="/preview-images/exchange.svg" alt="Original" />',
      '<img src="https://example.com/preview-images/external.svg" alt="External" />',
      '![[exchange.svg]]',
    ].join("\n\n");
    for (const chapter of CHAPTERS) {
      fs.writeFileSync(path.join(chaptersDir, `${chapter.number}-fixture.md`), source);
    }

    execFileSync(process.execPath, [path.resolve("scripts/promote-chapters.mjs")], {
      cwd: directory,
      stdio: "pipe",
    });

    const promoted = fs.readFileSync(
      path.join(directory, "content/book/book/01-one-problem-worth-solving.mdx"),
      "utf8",
    );
    expect(promoted).toContain('<img src="/book-images/exchange.svg"');
    expect(promoted).toContain("<img src='/book-images/exchange.svg'");
    expect(promoted).toContain('<ZoomableImage src="/book-images/exchange.svg"');
    expect(promoted).not.toMatch(/src=["']\/preview-images\//);
    expect(promoted).toContain('src="https://example.com/preview-images/external.svg"');
    expect(fs.readFileSync(path.join(directory, "public/book-images/exchange.svg"), "utf8")).toBe(image);
  });
});
