"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  // The homepage hero already shows a full grid directly beneath the
  // header, so repeating the (cropped) grid here would just duplicate it.
  const isHome = pathname === "/";

  return (
    <header
      className={`${isHome ? "" : "header-grid "}flex items-center justify-between px-4 py-6 max-w-(--width-wide) mx-auto border-b border-border`}
    >
      <Link href="/" className="text-h6 font-heading">
        Agentic Journey
      </Link>
      <nav className="flex gap-6 text-p2">
        <Link href="/about/">About</Link>
      </nav>
    </header>
  );
}
