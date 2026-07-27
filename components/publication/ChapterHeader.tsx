export function ChapterHeader({
  partTitle,
  chapterNumber,
  title,
  summary,
}: {
  partTitle: string;
  chapterNumber: number;
  title: string;
  summary: string;
}) {
  return (
    <header className="mb-10">
      <p className="text-eyebrow text-foreground-subtle">
        {partTitle} · Chapter {chapterNumber}
      </p>
      <h1 className="text-h1 mt-2">{title}</h1>
      <p className="text-lead text-foreground-secondary mt-4">{summary}</p>
    </header>
  );
}
