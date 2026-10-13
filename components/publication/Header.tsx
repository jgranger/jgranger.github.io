import Link from "next/link";

export function Header() {
  return (
    <header className="book-masthead">
      <div className="book-masthead__navigation">
        <Link href="/" className="book-masthead__author">Jonathan Granger</Link>
        <nav aria-label="Main navigation">
          <Link href="/about/">About</Link>
        </nav>
      </div>
      <div className="book-masthead__hero">
        <div className="book-masthead__art" aria-hidden="true" />
        <div className="book-masthead__copy">
          <Link href="/" className="book-masthead__title" aria-label="Agentic Journey home">
            <span>Agentic</span>
            <span>Journey</span>
          </Link>
          <p className="book-masthead__tagline">Attention becomes action.</p>
        </div>
      </div>
    </header>
  );
}
