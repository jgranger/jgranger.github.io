import { describe, it, expect } from "vitest";
import { clampStepIndex, nextStepIndex, previousStepIndex } from "./flowSteps";

describe("clampStepIndex", () => {
  it("clamps below zero up to zero", () => {
    expect(clampStepIndex(-1, 5)).toBe(0);
  });
  it("clamps above the last index down to the last index", () => {
    expect(clampStepIndex(10, 5)).toBe(4);
  });
  it("passes through valid indices unchanged", () => {
    expect(clampStepIndex(2, 5)).toBe(2);
  });
});

describe("nextStepIndex", () => {
  it("advances by one", () => {
    expect(nextStepIndex(1, 5)).toBe(2);
  });
  it("does not advance past the last step", () => {
    expect(nextStepIndex(4, 5)).toBe(4);
  });
});

describe("previousStepIndex", () => {
  it("goes back by one", () => {
    expect(previousStepIndex(2, 5)).toBe(1);
  });
  it("does not go below the first step", () => {
    expect(previousStepIndex(0, 5)).toBe(0);
  });
});
