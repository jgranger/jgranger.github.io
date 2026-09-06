"use client";

import { useMemo, useState } from "react";
import {
  citationEdges,
  citationNodes,
  type CitationNode,
} from "@/content/citation-graph";

const typeLabel: Record<CitationNode["type"], string> = {
  concept: "Book concept",
  research: "Research",
  experience: "Production experience",
};

function nodeRadius(node: CitationNode) {
  if (node.type === "concept") return 34;
  if (node.type === "experience") return 27;
  return 24;
}

export function CitationGraph() {
  const [selectedId, setSelectedId] = useState("operational-context");

  const selected = useMemo(
    () => citationNodes.find((node) => node.id === selectedId) ?? citationNodes[0],
    [selectedId],
  );

  const connectedIds = useMemo(() => {
    const ids = new Set<string>([selected.id]);
    for (const edge of citationEdges) {
      if (edge.source === selected.id) ids.add(edge.target);
      if (edge.target === selected.id) ids.add(edge.source);
    }
    return ids;
  }, [selected.id]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 px-5 py-4 text-sm text-white/60">
          Tap a node to reveal its research neighborhood.
        </div>
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 1120 760"
            className="min-h-[580px] w-full min-w-[820px]"
            role="img"
            aria-label="Interactive citation graph connecting Agentic Journey concepts with research and production experience"
          >
            <defs>
              <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {citationEdges.map((edge) => {
              const source = citationNodes.find((node) => node.id === edge.source);
              const target = citationNodes.find((node) => node.id === edge.target);
              if (!source || !target) return null;

              const active =
                edge.source === selected.id || edge.target === selected.id;

              return (
                <g key={`${edge.source}-${edge.target}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={active ? "rgba(148, 163, 255, 0.78)" : "rgba(156, 163, 175, 0.18)"}
                    strokeWidth={active ? 2 : 1}
                  />
                  {active && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 8}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.48)"
                      fontSize="11"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    >
                      {edge.relationship}
                    </text>
                  )}
                </g>
              );
            })}

            {citationNodes.map((node) => {
              const active = node.id === selected.id;
              const connected = connectedIds.has(node.id);
              const radius = nodeRadius(node);

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${node.title}`}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={
                      active
                        ? "rgba(103, 232, 249, 0.16)"
                        : node.type === "concept"
                          ? "rgba(139, 92, 246, 0.10)"
                          : "rgba(15, 23, 42, 0.88)"
                    }
                    stroke={
                      active
                        ? "rgba(103, 232, 249, 0.95)"
                        : connected
                          ? "rgba(196, 181, 253, 0.72)"
                          : "rgba(148, 163, 184, 0.32)"
                    }
                    strokeWidth={active ? 2.5 : connected ? 1.8 : 1}
                    filter={active ? "url(#soft-glow)" : undefined}
                  />
                  <text
                    x={node.x}
                    y={node.y + radius + 22}
                    textAnchor="middle"
                    fill={active || connected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.46)"}
                    fontSize={node.type === "concept" ? "14" : "12"}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    {node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <aside className="self-start rounded-3xl border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-6">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
          {typeLabel[selected.type]}
          {selected.chapter ? ` · Chapter ${selected.chapter}` : ""}
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          {selected.title}
        </h2>
        {selected.subtitle && (
          <p className="mt-2 text-sm text-white/55">{selected.subtitle}</p>
        )}
        <p className="mt-5 text-sm leading-6 text-white/75">{selected.summary}</p>

        <div className="mt-6 space-y-3">
          {selected.links.map((link) => (
            <a
              key={`${selected.id}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                {link.kind}
              </div>
              <div className="mt-1 text-sm font-medium leading-5 text-white/90">
                {link.label}
              </div>
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}
