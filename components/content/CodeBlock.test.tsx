import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("renders the file name and code", () => {
    render(
      <CodeBlock code="const x = 1;" language="ts" fileName="example.ts" />
    );
    expect(screen.getByText("example.ts")).toBeInTheDocument();
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("copies the code to the clipboard when the copy button is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="const x = 1;" language="ts" />);
    fireEvent.click(screen.getByTestId("copy-code-button"));

    expect(writeText).toHaveBeenCalledWith("const x = 1;");
  });
});
