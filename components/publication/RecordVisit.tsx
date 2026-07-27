"use client";

import { useEffect } from "react";
import { recordChapterVisit } from "./ContinueReading";

export function RecordVisit({
  title,
  part,
  slug,
}: {
  title: string;
  part: string;
  slug: string;
}) {
  useEffect(() => {
    recordChapterVisit({ title, part, slug });
  }, [title, part, slug]);
  return null;
}
