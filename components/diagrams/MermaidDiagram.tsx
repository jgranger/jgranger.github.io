"use client";

import { useEffect, useId, useRef } from "react";
import mermaid from "mermaid";

let initialized = false;

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "-");

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });
      initialized = true;
    }
    let cancelled = false;
    mermaid.render(`mermaid-${id}`, chart).then(({ svg }) => {
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return <div ref={containerRef} className="my-8 overflow-x-auto" />;
}
