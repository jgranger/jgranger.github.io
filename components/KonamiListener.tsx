"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SEQUENCE = [
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

export function KonamiListener() {
  const router = useRouter();
  const progress = useRef(0);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const expected = SEQUENCE[progress.current];
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === expected) {
        progress.current += 1;
        if (progress.current === SEQUENCE.length) {
          progress.current = 0;
          sessionStorage.setItem("konami-unlocked", "true");
          router.push("/end-of-line/");
        }
      } else {
        // Allow the sequence to restart cleanly if the first key of a new
        // attempt is typed right after a mistake, rather than requiring a
        // fully idle keyboard first.
        progress.current = key === SEQUENCE[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [router]);

  return null;
}
