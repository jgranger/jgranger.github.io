"use client";

import { useState } from "react";

export function CodeBlock({
  code,
  language,
  fileName,
  highlightLines = [],
}: {
  code: string;
  language: string;
  fileName?: string;
  highlightLines?: number[];
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-border">
      <div className="flex min-w-0 items-center justify-between gap-3 bg-background-elevated px-3 py-2 sm:px-4">
        <span className="truncate text-small text-foreground-subtle">
          {fileName ?? language}
        </span>
        <button
          type="button"
          data-testid="copy-code-button"
          onClick={handleCopy}
          className="min-h-11 shrink-0 px-2 text-small text-foreground-subtle underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto bg-background-elevated p-3 text-xs text-foreground sm:p-4 sm:text-sm">
        <code>
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                highlightLines.includes(i + 1) ? "bg-accent-violet/15 -mx-4 px-4" : undefined
              }
            >
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
