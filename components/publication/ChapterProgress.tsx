"use client";

import { useEffect, useState } from "react";

function computeProgress(): number {
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (scrollableHeight <= 0) return 100;
  const raw = (window.scrollY / scrollableHeight) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function ChapterProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(computeProgress());
    function handleScroll() {
      setProgress(computeProgress());
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 h-1 bg-accent z-50 transition-[width]"
      style={{ width: `${progress}%` }}
    />
  );
}
