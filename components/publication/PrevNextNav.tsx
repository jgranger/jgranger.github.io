import Link from "next/link";
import type { AdjacentChapters } from "@/types/content";

export function PrevNextNav({ adjacent }: { adjacent: AdjacentChapters }) {
  return (
    <nav className="mt-16 flex flex-col md:flex-row justify-between gap-4 border-t border-border pt-6">
      <div>
        {adjacent.previous && (
          <Link
            href={`/book/${adjacent.previous.part}/${adjacent.previous.slug}/`}
            className="text-p1 text-accent"
          >
            ← {adjacent.previous.title}
          </Link>
        )}
      </div>
      <div className="text-right">
        {adjacent.next && (
          <Link
            href={`/book/${adjacent.next.part}/${adjacent.next.slug}/`}
            className="text-p1 text-accent"
          >
            {adjacent.next.title} →
          </Link>
        )}
      </div>
    </nav>
  );
}
