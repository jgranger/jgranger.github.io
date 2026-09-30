import { describe, expect, it } from "vitest";
import { responsiveSources } from "./responsive-images.mjs";

const images = new Map([
  ["A diagram.png", { safeName: "a-diagram-1.png" }],
  ["A diagram.phone.svg", { safeName: "a-diagram.phone.svg" }],
  ["A diagram.tablet.webp", { safeName: "a-diagram.tablet.webp" }],
  ["a-diagram.png", { safeName: "a-diagram.png" }],
]);

describe("responsive image discovery", () => {
  it("pairs variants by original name even when public names collide", () => {
    expect(responsiveSources("/book-images/a-diagram-1.png", images, "/book-images")).toEqual({
      phoneSrc: "/book-images/a-diagram.phone.svg",
      tabletSrc: "/book-images/a-diagram.tablet.webp",
    });
    expect(responsiveSources("/book-images/a-diagram.png", images, "/book-images")).toEqual({});
  });
  it("keeps images without variants unchanged", () => {
    expect(responsiveSources("/book-images/photo.png", images, "/book-images")).toEqual({});
  });
  it("rejects ambiguous variants instead of silently choosing one", () => {
    const ambiguous = new Map(images);
    ambiguous.set("A diagram.phone.png", { safeName: "a-diagram.phone.png" });
    expect(() => responsiveSources("/book-images/a-diagram-1.png", ambiguous, "/book-images")).toThrow("Multiple phone variants");
  });
});
