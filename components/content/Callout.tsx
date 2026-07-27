const LABELS = {
  insight: "Insight",
  lesson: "Lesson",
  warning: "Warning",
  context: "Context",
  result: "Result",
} as const;

type CalloutType = keyof typeof LABELS;

export function Callout({
  type,
  children,
}: {
  type: CalloutType;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-lg border border-border bg-muted p-4">
      <p className="text-eyebrow text-foreground-subtle mb-2">
        {LABELS[type]}
      </p>
      <div className="text-p1 text-foreground-secondary">{children}</div>
    </div>
  );
}
