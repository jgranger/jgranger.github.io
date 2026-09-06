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
  const [gameUnlocked, setGameUnlocked] = useState(false);

  useEffect(() => {
    setBonusUnlocked(sessionStorage.getItem("konami-unlocked") === "true");
    setGameUnlocked(sessionStorage.getItem("game-unlocked") === "true");
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        aria-controls="chapter-sidebar"
        className="mb-6 flex min-h-12 w-full items-center justify-center rounded-lg border border-border px-4 py-3 text-p2 text-accent lg:hidden"
      >
        {mobileOpen ? "Hide chapters" : "All chapters"}
      </button>
      <aside
        id="chapter-sidebar"
        className={`${mobileOpen ? "block" : "hidden"} mb-8 w-full shrink-0 rounded-lg border border-border bg-background-elevated p-3 lg:sticky lg:top-8 lg:mb-0 lg:block lg:w-56 lg:self-start lg:border-0 lg:bg-transparent lg:p-0`}
      >
        <nav aria-label="All chapters">
          <ul className="space-y-2 text-p2">
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  href={`/book/${chapter.part}/${chapter.slug}/`}
                  className={`block min-h-11 rounded-md px-3 py-2.5 lg:min-h-0 lg:px-0 lg:py-1 ${
                    chapter.slug === currentSlug
                      ? "text-accent font-medium"
                      : "text-foreground-secondary hover:text-accent"
                  }`}
                >
                  {chapter.chapterNumber}. {chapter.title}
                </Link>
              </li>
            ))}
            {bonusUnlocked && (
              <li>
                <Link
                  href="/for-the-users/"
                  className={
                    currentSlug === "for-the-users"
                      ? "text-accent font-medium italic"
                      : "text-foreground-subtle hover:text-accent italic"
                  }
                >
                  12. For the Users
                </Link>
              </li>
            )}
            {gameUnlocked && (
              <li>
                <Link
                  href="/full-access/"
                  className={
                    currentSlug === "full-access"
                      ? "text-accent font-medium italic"
                      : "text-foreground-subtle hover:text-accent italic"
                  }
                >
                  13. Full Access
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}
