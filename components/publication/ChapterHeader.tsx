export function ChapterHeader({
  partTitle,
  chapterNumber,
  title,
  summary,
}: {
  partTitle: string;
  // Omitted for pages that aren't a numbered chapter at all (e.g. the
  // citation graph reference page) rather than assigning them a fake one.
  chapterNumber?: number;
  title: string;
  summary: string;
}) {
  const eyebrow = [partTitle, chapterNumber ? `Chapter ${chapterNumber}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="mb-8 sm:mb-10">
      {eyebrow && <p className="text-eyebrow text-foreground-subtle">{eyebrow}</p>}
      <h1 className="text-h1 mt-2">{title}</h1>
      <p className="text-lead text-foreground-secondary mt-4">{summary}</p>
    </header>
  );
}
