export function TechnicalDetail({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="my-6 rounded-lg border border-border p-4">
      <summary className="text-p1 font-heading cursor-pointer text-accent">
        {title}
      </summary>
      <div className="mt-4 text-p2 text-foreground-secondary">{children}</div>
    </details>
  );
}
