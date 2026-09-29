// @vitest-environment node
import { describe, it, expect } from "vitest";
import { assignSafeNames } from "./image-names.mjs";

describe("assignSafeNames", () => {
  it("slugifies spaces and case", () => {
    expect(assignSafeNames(["Sales Opps.PNG"]).get("Sales Opps.PNG")).toBe("sales-opps.png");
  });

  it("never lets a slugified name overwrite an existing safe name", () => {
    const names = assignSafeNames(["msg-send-2.png", "msg-send 2.png", "msg-send-2-1.png"]);
    expect(names.get("msg-send-2.png")).toBe("msg-send-2.png");
    expect(names.get("msg-send-2-1.png")).toBe("msg-send-2-1.png");
    expect(names.get("msg-send 2.png")).toBe("msg-send-2-2.png");
  });

  it("gives every input a distinct output", () => {
    const input = ["a b.png", "a-b.png", "A B.png", "a  b.png"];
    const out = [...assignSafeNames(input).values()];
    expect(new Set(out).size).toBe(input.length);
  });
});
