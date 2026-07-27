export function Quote({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="my-6 border-l-4 border-accent pl-4">
      <p className="text-lead font-heading text-foreground">{children}</p>
      {attribution && (
        <cite className="text-small text-foreground-subtle block mt-2">
          {attribution}
        </cite>
      )}
    </blockquote>
  );
}
