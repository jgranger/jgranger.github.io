import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Callout } from "./Callout";

describe("Callout", () => {
  it("renders its children", () => {
    render(<Callout type="insight">Something worth noting.</Callout>);
    expect(screen.getByText("Something worth noting.")).toBeInTheDocument();
  });

  it("labels each callout type for screen readers", () => {
    render(<Callout type="warning">Careful here.</Callout>);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
