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
      className="inline-block rounded-lg bg-accent text-accent-foreground px-6 py-3 text-p1"
    >
      Continue reading: {chapter.title}
    </Link>
  );
}
