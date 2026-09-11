// @vitest-environment node
//
// Runs in CI (npm test, which the deploy workflow runs before npm run
// build) against the real committed content/book/*.mdx — the one place
// that's always checked automatically, with no separate script to
// remember to run. scripts/lib/verify-mdx.test.ts covers the verifier
// itself; scripts/promote-chapters.mjs and sync-preview-content.mjs run
// the same check against generated private content, but only when a
// human runs them.
import { describe, it, expect } from "vitest";
import path from "node:path";
import { verifyMdxDir, reportMdxFailures } from "../scripts/lib/verify-mdx.mjs";

const ROOT = path.join(__dirname, "..");

describe("public content/book MDX", () => {
  it("every committed chapter compiles", async () => {
    const failures = await verifyMdxDir(path.join(ROOT, "content/book"));
    reportMdxFailures(failures, ROOT);
    expect(failures).toEqual([]);
  });
});
