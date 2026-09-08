"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { citationNodes, type CitationNode } from "@/content/citation-graph";

type VisualNode = {
  id: string;
  title: string;
  description: string;
  link: string;
  kind: CitationNode["kind"];
  chapter?: number;
  decorative: boolean;
  x?: number;
  y?: number;
  z?: number;
  fx: number;
  fy: number;
  fz: number;
};

type VisualLink = {
  source: string | VisualNode;
  target: string | VisualNode;
  relationship: string;
};

type GraphData = {
  nodes: VisualNode[];
  links: VisualLink[];
};

interface ForceGraphInstance {
  graphData(data: GraphData): ForceGraphInstance;
  width(value: number): ForceGraphInstance;
  height(value: number): ForceGraphInstance;
  backgroundColor(value: string): ForceGraphInstance;
  showNavInfo(value: boolean): ForceGraphInstance;
  nodeLabel(value: (node: VisualNode) => string): ForceGraphInstance;
  nodeColor(value: (node: VisualNode) => string): ForceGraphInstance;
  nodeVal(value: (node: VisualNode) => number): ForceGraphInstance;
  nodeOpacity(value: number): ForceGraphInstance;
  linkColor(value: (link: VisualLink) => string): ForceGraphInstance;
  linkWidth(value: (link: VisualLink) => number): ForceGraphInstance;
  linkOpacity(value: number): ForceGraphInstance;
  enableNodeDrag(value: boolean): ForceGraphInstance;
  onNodeClick(value: (node: VisualNode) => void): ForceGraphInstance;
  onNodeHover(value: (node: VisualNode | null) => void): ForceGraphInstance;
  cameraPosition(
    position: { x: number; y: number; z: number },
    lookAt?: { x?: number; y?: number; z?: number },
    duration?: number,
  ): ForceGraphInstance;
  zoomToFit(
    duration?: number,
    padding?: number,
    nodeFilter?: (node: VisualNode) => boolean,
  ): ForceGraphInstance;
  refresh(): ForceGraphInstance;
  pauseAnimation(): ForceGraphInstance;
}

interface ForceGraphConstructor {
  new (
    element: HTMLElement,
    options?: { controlType?: "trackball" | "orbit" | "fly" },
  ): ForceGraphInstance;
}

declare global {
  interface Window {
    ForceGraph3D?: ForceGraphConstructor;
  }
}

const kindLabel: Record<NonNullable<CitationNode["kind"]>, string> = {
  concept: "Book concept",
  research: "Research",
  experience: "Production experience",
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function citationPosition(index: number, count: number) {
  const side = index % 2 === 0 ? -1 : 1;
  const hemisphereIndex = Math.floor(index / 2);
  const hemisphereCount = Math.ceil(count / 2);
  const t = (hemisphereIndex + 0.5) / hemisphereCount;
  const yUnit = 1 - t * 2;
  const ring = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
  const angle = GOLDEN_ANGLE * hemisphereIndex;
  const xDepth = 0.35 + 0.65 * Math.abs(Math.cos(angle));

  return {
    x: side * (24 + xDepth * 58 * ring),
    y: yUnit * 78,
    z: Math.sin(angle) * ring * 72,
  };
}

function brainShell() {
  const shell: VisualNode[] = [];
  const pointsPerSide = 72;

  for (const side of [-1, 1]) {
    for (let index = 0; index < pointsPerSide; index += 1) {
      const t = index / (pointsPerSide - 1);
      const yUnit = 1 - t * 2;
      const ring = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
      const angle = GOLDEN_ANGLE * index;
      const xDepth = 0.18 + 0.82 * Math.abs(Math.cos(angle));
      const position = {
        x: side * (18 + xDepth * 66 * ring),
        y: yUnit * 82,
        z: Math.sin(angle) * ring * 76,
      };

      shell.push({
        id: `brain-shell-${side}-${index}`,
        title: "",
        description: "",
        link: "",
        kind: undefined,
        decorative: true,
        ...position,
        fx: position.x,
        fy: position.y,
        fz: position.z,
      });
    }
  }

  return shell;
}

function endpointId(endpoint: string | VisualNode) {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}

function buildGraphData(): GraphData {
  const titles = new Set(citationNodes.map((node) => node.title));

  const nodes = citationNodes.map((node, index) => {
    const position = citationPosition(index, citationNodes.length);

    return {
      id: node.title,
      title: node.title,
      description: node.description,
      link: node.link,
      kind: node.kind ?? "research",
      chapter: node.chapter,
      decorative: false,
      ...position,
      fx: position.x,
      fy: position.y,
      fz: position.z,
    } satisfies VisualNode;
  });

  const links = citationNodes.flatMap((node) =>
    (node.connections ?? []).flatMap((connection) => {
      const target =
        typeof connection === "string" ? connection : connection.title;
      const relationship =
        typeof connection === "string" ? "related" : connection.relationship;

      if (!titles.has(target)) return [];

      return [
        {
          source: node.title,
          target,
          relationship,
        },
      ];
    }),
  );

  return {
    nodes: [...brainShell(), ...nodes],
    links,
  };
}

function relatedTitles(title: string, links: VisualLink[]) {
  const related = new Set<string>([title]);

  for (const link of links) {
    const source = endpointId(link.source);
    const target = endpointId(link.target);
    if (source === title) related.add(target);
    if (target === title) related.add(source);
  }

  return related;
}

export function CitationGraph() {
  const [scriptReady, setScriptReady] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(citationNodes[0]?.title ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance | null>(null);
  const selectedTitleRef = useRef(selectedTitle);
  const relatedTitlesRef = useRef(new Set<string>([selectedTitle]));
  const graphData = useMemo(() => buildGraphData(), []);

  const selected = useMemo(
    () =>
      citationNodes.find((node) => node.title === selectedTitle) ??
      citationNodes[0],
    [selectedTitle],
  );

  useEffect(() => {
    selectedTitleRef.current = selectedTitle;
    relatedTitlesRef.current = relatedTitles(selectedTitle, graphData.links);
    graphRef.current?.refresh();
  }, [graphData.links, selectedTitle]);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.ForceGraph3D) return;

    const container = containerRef.current;
    const graph = new window.ForceGraph3D(container, { controlType: "orbit" });

    graphRef.current = graph;

    graph
      .graphData(graphData)
      .backgroundColor("#020207")
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeOpacity(0.9)
      .linkOpacity(0.68)
      .nodeVal((node) => {
        if (node.decorative) return 0.18;
        if (node.id === selectedTitleRef.current) return 5.4;
        if (node.kind === "concept") return 4.7;
        if (node.kind === "experience") return 4;
        return 3.2;
      })
      .nodeColor((node) => {
        if (node.decorative) return "#312e81";
        if (node.id === selectedTitleRef.current) return "#67e8f9";
        if (relatedTitlesRef.current.has(node.id)) return "#c4b5fd";
        if (node.kind === "concept") return "#8b5cf6";
        if (node.kind === "experience") return "#22d3ee";
        return "#64748b";
      })
      .nodeLabel((node) =>
        node.decorative
          ? ""
          : `<div style="max-width:260px"><strong>${node.title}</strong></div>`,
      )
      .linkColor((link) => {
        const source = endpointId(link.source);
        const target = endpointId(link.target);
        return source === selectedTitleRef.current ||
          target === selectedTitleRef.current
          ? "#a5b4fc"
          : "#353653";
      })
      .linkWidth((link) => {
        const source = endpointId(link.source);
        const target = endpointId(link.target);
        return source === selectedTitleRef.current ||
          target === selectedTitleRef.current
          ? 1.6
          : 0.45;
      })
      .onNodeHover((node) => {
        container.style.cursor = node && !node.decorative ? "pointer" : "grab";
      })
      .onNodeClick((node) => {
        if (node.decorative) return;

        setSelectedTitle(node.id);
        selectedTitleRef.current = node.id;
        relatedTitlesRef.current = relatedTitles(node.id, graphData.links);
        graph.refresh();

        const x = node.x ?? node.fx;
        const y = node.y ?? node.fy;
        const z = node.z ?? node.fz;
        const distance = 95;
        const magnitude = Math.hypot(x, y, z);
        const ratio = magnitude ? 1 + distance / magnitude : 1;

        graph.cameraPosition(
          {
            x: x * ratio,
            y: y * ratio,
            z: z * ratio,
          },
          { x, y, z },
          700,
        );
      });

    const resize = () => {
      const width = container.clientWidth;
      const height = Math.max(500, Math.min(700, width * 0.72));
      graph.width(width).height(height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    window.setTimeout(
      () => graph.zoomToFit(700, 48, (node) => !node.decorative),
      120,
    );

    return () => {
      observer.disconnect();
      graph.pauseAnimation();
      graphRef.current = null;
      container.replaceChildren();
    };
  }, [graphData, scriptReady]);

  if (!selected) return null;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.0/dist/3d-force-graph.min.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 px-5 py-4 text-sm text-white/60">
            Drag to rotate. Scroll to zoom. Select a node to explore its neighborhood.
          </div>
          <div
            ref={containerRef}
            className="min-h-[500px] w-full bg-[#020207]"
            role="img"
            aria-label="Rotatable three-dimensional citation graph shaped like a human brain"
          />
        </div>

        <aside className="self-start rounded-3xl border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-6">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            {kindLabel[selected.kind ?? "research"]}
            {selected.chapter ? ` · Chapter ${selected.chapter}` : ""}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {selected.title}
          </h2>
          <p className="mt-5 text-sm leading-6 text-white/75">
            {selected.description}
          </p>
          <a
            href={selected.link}
            target="_blank"
            rel="noreferrer"
            className="mt-6 block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]"
          >
            Open link
          </a>
        </aside>
      </div>
    </>
  );
}
