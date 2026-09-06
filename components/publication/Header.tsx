"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return null;
  }

  return (
    <header className="header-grid flex items-center justify-between px-4 py-6 max-w-(--width-wide) mx-auto border-b border-border">
      <Link href="/" className="text-h6 font-heading">
        Agentic Journey
      </Link>
      <nav className="flex gap-6 text-p2">
        <Link href="/about/">About</Link>
      </nav>
    </header>
  );
}
