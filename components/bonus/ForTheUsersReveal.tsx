"use client";

import { useEffect, useState, type ReactNode } from "react";

const REVEAL_DURATION_MS = 2800;

export function ForTheUsersReveal({ children }: { children: ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const timeout = setTimeout(
      () => setShowOverlay(false),
      reducedMotion ? 0 : REVEAL_DURATION_MS
    );
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {showOverlay && (
        <div className="reveal-overlay" aria-hidden="true">
          <div className="reveal-grid" />
          <div className="reveal-flash" />
          <div className="reveal-title">
            <h1 className="text-h1">For the Users</h1>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
