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
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

      const expected = SEQUENCE[progress.current];
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === expected) {
        if (progress.current > 0) {
          event.preventDefault();
          event.stopPropagation();
        }
        progress.current += 1;
        if (progress.current === SEQUENCE.length) {
          progress.current = 0;
          sessionStorage.setItem("konami-unlocked", "true");
          router.push("/for-the-users/");
        }
      } else {
        // Allow the sequence to restart cleanly if the first key of a new
        // attempt is typed right after a mistake, rather than requiring a
        // fully idle keyboard first.
        progress.current = key === SEQUENCE[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", handleKeydown, true);
    return () => window.removeEventListener("keydown", handleKeydown, true);
  }, [router]);

  return null;
}
