import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZoomableImage } from "./ZoomableImage";

describe("viewport-specific images", () => {
  it("provides phone and tablet sources with a desktop fallback", () => {
    const { container } = render(<ZoomableImage src="/desktop.png" phoneSrc="/phone.svg" tabletSrc="/tablet.svg" alt="Diagram" />);
    const sources = container.querySelectorAll("source");
    expect(sources[0]).toHaveAttribute("media", "(max-width: 639px)");
    expect(sources[0]).toHaveAttribute("srcset", "/phone.svg");
    expect(sources[1]).toHaveAttribute("media", "(min-width: 640px) and (max-width: 1023px)");
    expect(screen.getByRole("img")).toHaveAttribute("src", "/desktop.png");
  });
  it("opens the version actually displayed, not the desktop diagram", () => {
    render(<ZoomableImage src="/desktop.png" phoneSrc="/phone.svg" alt="Diagram" />);
    Object.defineProperty(screen.getByRole("img"), "currentSrc", { value: "https://example.test/phone.svg" });
    fireEvent.click(screen.getByRole("button", { name: "Open image viewer: Diagram" }));
    expect(screen.getByRole("dialog").querySelector("img")).toHaveAttribute("src", "https://example.test/phone.svg");
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
  });
});
