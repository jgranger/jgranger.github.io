// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { verifyMdxDir } from "./verify-mdx.mjs";

let tmpDir: string;

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFixture(name: string, content: string): string {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-mdx-test-"));
  fs.writeFileSync(path.join(tmpDir, name), content);
  return tmpDir;
}

describe("verifyMdxDir", () => {
  it("reports no failures for valid MDX", async () => {
    const dir = writeFixture(
      "ok.mdx",
      "---\ntitle: OK\n---\nSome *valid* prose with a [link](https://example.com).\n"
    );
    expect(await verifyMdxDir(dir)).toEqual([]);
  });

  it("catches an escaped quote inside a JSX attribute (the exact bug that shipped)", async () => {
    const dir = writeFixture(
      "broken.mdx",
      '---\ntitle: Broken\n---\n<VideoEmbed title="a \\"b\\"" src="/x.mp4" />\n'
    );
    const failures = await verifyMdxDir(dir);
    expect(failures).toHaveLength(1);
    expect(failures[0].file).toContain("broken.mdx");
    expect(failures[0].error.message).toMatch(/attribute/i);
  });

  it("returns an empty array for a directory with no .mdx files", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-mdx-test-"));
    expect(await verifyMdxDir(tmpDir)).toEqual([]);
  });

  it("returns an empty array for a non-existent directory rather than throwing", async () => {
    expect(await verifyMdxDir("/nonexistent/path/for/sure")).toEqual([]);
  });
});
