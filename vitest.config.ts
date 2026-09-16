import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror tsconfig.json's "@/*": ["./*"] path mapping. Next resolves this
    // itself during a build, but vitest doesn't read tsconfig paths, so any
    // test importing a component that uses an @/ import failed to resolve —
    // and it only broke once the first such component (ContinueReading, via
    // @/lib/chapterHref) came under test. Keep this in step with tsconfig.
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
