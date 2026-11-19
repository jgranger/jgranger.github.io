"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function BookVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    let source = "direct";
    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.host !== location.host) {
          source = referrer.hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 100) || "direct";
        }
      } catch {}
    }
    const data = JSON.stringify({ path: pathname, source });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/__book_visit", new Blob([data], { type: "text/plain" }));
    } else {
      fetch("/__book_visit", {
        method: "POST",
        body: data,
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
