import { describe, expect, it } from "vitest";
import { renderDiagram } from "./diagram-variants.mjs";

const spec = {
  source: "example.png",
  layout: "stages",
  title: "Search flow",
  sections: [{ title: "Find evidence", caption: "Search the sources", description: "This explanation appears only on larger viewports.", graphic: '<circle cx="20" cy="20" r="8"/>', graphicHeight: 40 }],
};

describe("art-directed viewport compositions", () => {
  it("omits explanations from the entire phone SVG while preserving stage labels", () => {
    const svg = renderDiagram(spec, "phone");
    expect(svg).not.toContain(spec.sections[0].description);
    expect(svg).toContain(spec.sections[0].title);
    expect(svg).toContain(spec.sections[0].caption);
  });
  it.each(["tablet", "desktop"])("preserves the concise explanation on %s", viewport => {
    const doc = new DOMParser().parseFromString(renderDiagram(spec, viewport), "image/svg+xml");
    const text = [...doc.querySelectorAll("text")].map(node => [...node.querySelectorAll("tspan")].map(line => line.textContent).join(" ")).join(" ");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(text).toContain(spec.sections[0].description);
  });
  it("rejects unknown layouts instead of emitting incorrect artwork", () => {
    expect(() => renderDiagram({ ...spec, layout: "unknown" }, "phone")).toThrow("Unknown diagram layout");
  });
});
