import Link from "next/link";

export function Header() {
  return (
    <header className="tron-grid-bg flex items-center justify-between px-4 py-6 max-w-(--width-wide) mx-auto border-b border-border">
      <Link href="/" className="text-h6 font-heading">
        Agentic Journey
      </Link>
      <nav className="flex gap-6 text-p2">
        <Link href="/about/">About</Link>
      </nav>
    </header>
  );
}
