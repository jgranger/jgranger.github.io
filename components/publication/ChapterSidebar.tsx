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
