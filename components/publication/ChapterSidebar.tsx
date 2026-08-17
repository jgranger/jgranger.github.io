"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TocEntry } from "@/types/content";

export function ChapterSidebar({
  chapters,
  currentSlug,
}: {
  chapters: TocEntry[];
  currentSlug: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bonusUnlocked, setBonusUnlocked] = useState(false);

  useEffect(() => {
    setBonusUnlocked(sessionStorage.getItem("konami-unlocked") === "true");
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        aria-controls="chapter-sidebar"
        className="lg:hidden mb-6 text-p2 text-accent border border-border rounded-md px-3 py-2"
      >
        {mobileOpen ? "Hide chapters" : "All chapters"}
      </button>
      <aside
        id="chapter-sidebar"
        className={`${mobileOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-8 lg:self-start w-full lg:w-56 shrink-0 mb-8 lg:mb-0`}
      >
        <nav aria-label="All chapters">
          <ul className="space-y-2 text-p2">
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  href={`/book/${chapter.part}/${chapter.slug}/`}
                  className={
                    chapter.slug === currentSlug
                      ? "text-accent font-medium"
                      : "text-foreground-secondary hover:text-accent"
                  }
                >
                  {chapter.chapterNumber}. {chapter.title}
                </Link>
              </li>
            ))}
            {bonusUnlocked && (
              <li>
                <Link href="/end-of-line/" className="text-foreground-subtle hover:text-accent italic">
                  End of Line
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}
