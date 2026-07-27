import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TechnicalDetail } from "./TechnicalDetail";

describe("TechnicalDetail", () => {
  it("hides its content by default and shows the title", () => {
    render(
      <TechnicalDetail title="View evaluation output">
        <p>Secret detail.</p>
      </TechnicalDetail>
    );
    expect(screen.getByText("View evaluation output")).toBeInTheDocument();
    const details = screen.getByText("View evaluation output").closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("reveals its content when the summary is clicked", () => {
    render(
      <TechnicalDetail title="View evaluation output">
        <p>Secret detail.</p>
      </TechnicalDetail>
    );
    screen.getByText("View evaluation output").click();
    const details = screen.getByText("View evaluation output").closest("details");
    expect(details).toHaveAttribute("open");
  });
});
