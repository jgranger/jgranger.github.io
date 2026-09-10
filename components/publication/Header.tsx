import Link from "next/link";

export function Header() {
  return (
    <header className="header-grid mx-auto flex max-w-(--width-wide) items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
      <Link href="/" className="flex min-h-11 items-center text-h6 font-heading">
        Agentic Journey
      </Link>
      <nav className="flex gap-3 text-p2 sm:gap-6">
        <Link href="/about/" className="flex min-h-11 items-center px-2">About</Link>
      </nav>
    </header>
  );
}
