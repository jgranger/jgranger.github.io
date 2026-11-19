import net from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { checkAnalyticsStore, saveAnalyticsVisit } from "./analytics-store.js";

let listener;
const originalRedisUrl = process.env.REDIS_URL;

afterEach(async () => {
  process.env.REDIS_URL = originalRedisUrl;
  if (listener) {
    await new Promise((resolve) => listener.close(resolve));
    listener = undefined;
  }
});

async function serve(reply, check) {
  listener = net.createServer((socket) => {
    socket.once("data", (data) => {
      check?.(data.toString());
      socket.end(reply);
    });
  });
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const address = listener.address();
  process.env.REDIS_URL = `redis://127.0.0.1:${address.port}`;
}

describe("anonymous analytics persistence", () => {
  it("connects to the Key Value store", async () => {
    await serve("+PONG\r\n", (command) => expect(command).toContain("PING"));
    await expect(checkAnalyticsStore()).resolves.toBeUndefined();
  });

  it("persists visits with stable reader keys", async () => {
    const stats = JSON.stringify({
      first: 1,
      readers: 12,
      views: 36,
      chapterViews: 9,
      dayReaders: 7,
      dayViews: 13,
    });
    const reply = `$${Buffer.byteLength(stats)}\r\n${stats}\r\n`;
    await serve(reply, (command) => {
      expect(command).toContain("EVAL");
      expect(command).toContain("agentic-journey:readers");
      expect(command).toContain("/book/the-flywheel/");
      expect(command).toContain("2026-11-19");
    });
    const result = await saveAnalyticsVisit({
      visitor: "a".repeat(24),
      path: "/book/the-flywheel/",
      source: "direct",
      day: "2026-11-19",
    });
    expect(result).toMatchObject({ readers: 12, views: 36, first: 1 });
  });
});
