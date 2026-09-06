"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "agentic-journey:last-visited-chapter";

interface VisitedChapter {
  title: string;
  part: string;
  slug: string;
}

export function recordChapterVisit(entry: VisitedChapter): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function getLastVisitedChapter(): VisitedChapter | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VisitedChapter;
  } catch {
    return null;
  }
}

export function ContinueReading() {
  const [chapter, setChapter] = useState<VisitedChapter | null>(null);

  useEffect(() => {
    setChapter(getLastVisitedChapter());
  }, []);

  if (!chapter) return null;

  return (
    <Link
      href={`/book/${chapter.part}/${chapter.slug}/`}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-accent px-6 py-3 text-center text-p1 text-accent sm:w-auto"
    >
      Continue reading: {chapter.title}
    </Link>
  );
}
