import { render, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KonamiListener } from "./KonamiListener";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const sequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
  "Enter",
];

function press(key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("KonamiListener", () => {
  beforeEach(() => {
    sessionStorage.clear();
    push.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("captures the sequence and prevents the final Enter from triggering another navigation", () => {
    render(<KonamiListener />);

    const prevented = sequence.map(press);

    expect(prevented).toEqual([false, ...Array(10).fill(true)]);
    expect(sessionStorage.getItem("konami-unlocked")).toBe("true");
    expect(push).toHaveBeenCalledExactlyOnceWith("/for-the-users/");
  });

  it("does not navigate for an incomplete sequence", () => {
    render(<KonamiListener />);

    for (const key of ["b", "a", "Enter"]) press(key);

    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("konami-unlocked")).toBeNull();
  });
});
