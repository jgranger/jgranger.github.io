import Link from "next/link";
import type { AdjacentChapters } from "@/types/content";

export function PrevNextNav({ adjacent }: { adjacent: AdjacentChapters }) {
  return (
    <nav className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:mt-16 md:flex-row md:justify-between md:gap-4">
      <div className="min-w-0 md:max-w-[48%]">
        {adjacent.previous && (
          <Link
            href={`/book/${adjacent.previous.part}/${adjacent.previous.slug}/`}
            className="block min-h-12 rounded-lg border border-border px-4 py-3 text-p1 text-accent"
          >
            ← {adjacent.previous.title}
          </Link>
        )}
      </div>
      <div className="min-w-0 md:max-w-[48%] md:text-right">
        {adjacent.next && (
          <Link
            href={`/book/${adjacent.next.part}/${adjacent.next.slug}/`}
            className="block min-h-12 rounded-lg border border-border px-4 py-3 text-p1 text-accent"
          >
            {adjacent.next.title} →
          </Link>
        )}
      </div>
    </nav>
  );
}
