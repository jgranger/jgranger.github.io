import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChapterProgress } from "./ChapterProgress";

function setScrollGeometry({
  scrollY,
  scrollHeight,
  innerHeight,
}: {
  scrollY: number;
  scrollHeight: number;
  innerHeight: number;
}) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
}

describe("ChapterProgress", () => {
  beforeEach(() => {
    setScrollGeometry({ scrollY: 0, scrollHeight: 2000, innerHeight: 1000 });
  });

  it("starts at 0% when at the top of the page", () => {
    render(<ChapterProgress />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("updates its value on scroll", () => {
    render(<ChapterProgress />);
    setScrollGeometry({ scrollY: 500, scrollHeight: 2000, innerHeight: 1000 });
    fireEvent.scroll(window);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });

  it("caps at 100%", () => {
    render(<ChapterProgress />);
    setScrollGeometry({ scrollY: 5000, scrollHeight: 2000, innerHeight: 1000 });
    fireEvent.scroll(window);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
