"use client";

import { useEffect, useMemo, useRef } from "react";

type Point3D = {
  x: number;
  y: number;
  z: number;
};

type GraphNode = Point3D & {
  id: string;
  cluster: number;
};

type GraphEdge = {
  source: string;
  target: string;
};

type GraphScene = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sequence: string[];
};

type ProjectedNode = GraphNode & {
  screenX: number;
  screenY: number;
  perspective: number;
  rotatedZ: number;
};

const CLUSTER_CENTERS: Point3D[] = [
  { x: -1.55, y: 0.72, z: 0.12 },
  { x: -0.72, y: 1.02, z: -0.72 },
  { x: -1.18, y: -0.58, z: 0.7 },
  { x: 0.32, y: 0.92, z: 0.82 },
  { x: 1.42, y: 0.42, z: -0.46 },
  { x: 0.72, y: -0.72, z: -0.82 },
  { x: 1.58, y: -0.42, z: 0.62 },
];

const ROUTE = [0, 3, 4, 6, 2, 1, 5];
const NODES_PER_CLUSTER = 18;
const STEP_MS = 820;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function edgeKey(source: string, target: string) {
  return source < target ? `${source}|${target}` : `${target}|${source}`;
}

function buildGraph(): GraphScene {
  const random = seededRandom(481516234);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  const addEdge = (source: string, target: string) => {
    const key = edgeKey(source, target);
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push({ source, target });
  };

  CLUSTER_CENTERS.forEach((center, cluster) => {
    for (let index = 0; index < NODES_PER_CLUSTER; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random());
      const xRadius = 0.46 + random() * 0.28;
      const yRadius = 0.38 + random() * 0.28;
      const zRadius = 0.54 + random() * 0.34;

      nodes.push({
        id: `${cluster}-${index}`,
        cluster,
        x: center.x + Math.cos(angle) * radius * xRadius,
        y: center.y + (random() - 0.5) * 2 * radius * yRadius,
        z: center.z + Math.sin(angle) * radius * zRadius,
      });
    }

    for (let index = 0; index < NODES_PER_CLUSTER; index += 1) {
      addEdge(`${cluster}-${index}`, `${cluster}-${(index + 1) % NODES_PER_CLUSTER}`);
      addEdge(`${cluster}-${index}`, `${cluster}-${(index + 4) % NODES_PER_CLUSTER}`);
      if (index % 3 === 0) {
        addEdge(`${cluster}-${index}`, `${cluster}-${(index + 8) % NODES_PER_CLUSTER}`);
      }
    }
  });

  for (let index = 0; index < ROUTE.length; index += 1) {
    const current = ROUTE[index];
    const next = ROUTE[(index + 1) % ROUTE.length];
    addEdge(`${current}-5`, `${next}-0`);
  }

  [
    [0, 10, 1, 13],
    [0, 14, 2, 11],
    [1, 7, 3, 12],
    [1, 15, 4, 8],
    [2, 8, 5, 11],
    [2, 15, 6, 9],
    [3, 9, 4, 14],
    [3, 16, 6, 12],
    [4, 6, 5, 15],
    [4, 16, 6, 4],
    [5, 7, 6, 15],
    [0, 7, 4, 12],
  ].forEach(([sourceCluster, sourceNode, targetCluster, targetNode]) => {
    addEdge(`${sourceCluster}-${sourceNode}`, `${targetCluster}-${targetNode}`);
  });

  const sequence = ROUTE.flatMap((cluster) =>
    Array.from({ length: 6 }, (_, index) => `${cluster}-${index}`),
  );

  return { nodes, edges, sequence };
}

function rotate(point: Point3D, yaw: number, pitch: number): Point3D {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const x = point.x * cosYaw - point.z * sinYaw;
  const z = point.x * sinYaw + point.z * cosYaw;

  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  return {
    x,
    y: point.y * cosPitch - z * sinPitch,
    z: point.y * sinPitch + z * cosPitch,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

export function GraphTraversal3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graph = useMemo(() => buildGraph(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const view = {
      yaw: -0.62,
      pitch: 0.08,
      zoom: 1,
      dragging: false,
      pointerId: -1,
      lastX: 0,
      lastY: 0,
      lastInteraction: 0,
    };
    const size = { width: 0, height: 0, dpr: 1 };
    let frame = 0;
    let previousFrame = performance.now();
    const startedAt = previousFrame;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = clamp(width * 0.62, 430, 650);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      size.width = width;
      size.height = height;
      size.dpr = dpr;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (node: GraphNode): ProjectedNode => {
      const rotated = rotate(node, view.yaw, view.pitch);
      const cameraDistance = 6.4;
      const perspective = cameraDistance / (cameraDistance - rotated.z);
      const scale = Math.min(size.width, size.height) * 0.155 * view.zoom;

      return {
        ...node,
        screenX: size.width / 2 + rotated.x * scale * perspective,
        screenY: size.height / 2 - rotated.y * scale * perspective,
        perspective,
        rotatedZ: rotated.z,
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      view.dragging = true;
      view.pointerId = event.pointerId;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      view.lastInteraction = performance.now();
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!view.dragging || event.pointerId !== view.pointerId) return;
      const deltaX = event.clientX - view.lastX;
      const deltaY = event.clientY - view.lastY;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      view.yaw += deltaX * 0.008;
      view.pitch = clamp(view.pitch + deltaY * 0.006, -0.9, 0.9);
      view.lastInteraction = performance.now();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== view.pointerId) return;
      view.dragging = false;
      view.pointerId = -1;
      view.lastInteraction = performance.now();
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      view.zoom = clamp(view.zoom * Math.exp(-event.deltaY * 0.001), 0.72, 1.72);
      view.lastInteraction = performance.now();
    };

    const render = (now: number) => {
      const delta = now - previousFrame;
      previousFrame = now;

      if (!reducedMotion && !view.dragging && now - view.lastInteraction > 900) {
        view.yaw += delta * 0.000055;
      }

      context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      context.clearRect(0, 0, size.width, size.height);

      const background = context.createRadialGradient(
        size.width * 0.5,
        size.height * 0.48,
        0,
        size.width * 0.5,
        size.height * 0.48,
        Math.max(size.width, size.height) * 0.62,
      );
      background.addColorStop(0, "#090818");
      background.addColorStop(0.55, "#04040c");
      background.addColorStop(1, "#010104");
      context.fillStyle = background;
      context.fillRect(0, 0, size.width, size.height);

      const projected = graph.nodes.map(project);
      const projectedById = new Map(projected.map((node) => [node.id, node]));
      const elapsed = reducedMotion ? 0 : now - startedAt;
      const stepValue = elapsed / STEP_MS;
      const stepIndex = Math.floor(stepValue) % graph.sequence.length;
      const progress = reducedMotion ? 0.35 : stepValue - Math.floor(stepValue);
      const currentId = graph.sequence[stepIndex];
      const nextId = graph.sequence[(stepIndex + 1) % graph.sequence.length];
      const currentNode = nodeById.get(currentId)!;
      const nextNode = nodeById.get(nextId)!;
      const crossingClusters = currentNode.cluster !== nextNode.cluster;
      const activeCluster = crossingClusters && progress > 0.58
        ? nextNode.cluster
        : currentNode.cluster;

      const recentIds = new Set<string>();
      for (let offset = 0; offset < 7; offset += 1) {
        const index = (stepIndex - offset + graph.sequence.length) % graph.sequence.length;
        recentIds.add(graph.sequence[index]);
      }

      const activeClusterNodes = projected.filter((node) => node.cluster === activeCluster);
      if (activeClusterNodes.length > 0) {
        const centerX = activeClusterNodes.reduce((sum, node) => sum + node.screenX, 0) / activeClusterNodes.length;
        const centerY = activeClusterNodes.reduce((sum, node) => sum + node.screenY, 0) / activeClusterNodes.length;
        const radius = Math.max(
          95,
          ...activeClusterNodes.map((node) => Math.hypot(node.screenX - centerX, node.screenY - centerY)),
        ) * 1.55;
        const focus = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        focus.addColorStop(0, "rgba(103,232,249,0.09)");
        focus.addColorStop(0.42, "rgba(167,139,250,0.055)");
        focus.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = focus;
        context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      }

      const currentEdge = edgeKey(currentId, nextId);

      for (const edge of graph.edges) {
        const source = projectedById.get(edge.source);
        const target = projectedById.get(edge.target);
        if (!source || !target) continue;

        const key = edgeKey(edge.source, edge.target);
        const inActiveCluster = source.cluster === activeCluster && target.cluster === activeCluster;
        const onRecentPath = recentIds.has(edge.source) && recentIds.has(edge.target);
        const isCurrentEdge = key === currentEdge;

        let alpha = 0.075;
        let width = 0.55;
        let stroke = `rgba(139,92,246,${alpha})`;

        if (inActiveCluster) {
          alpha = 0.34;
          width = 0.85;
          stroke = `rgba(167,139,250,${alpha})`;
        }
        if (onRecentPath) {
          alpha = 0.72;
          width = 1.2;
          stroke = `rgba(196,181,253,${alpha})`;
        }
        if (isCurrentEdge) {
          alpha = 0.95;
          width = 1.65;
          stroke = `rgba(103,232,249,${alpha})`;
        }

        context.beginPath();
        context.moveTo(source.screenX, source.screenY);
        context.lineTo(target.screenX, target.screenY);
        context.strokeStyle = stroke;
        context.lineWidth = width;
        context.stroke();
      }

      const orderedNodes = [...projected].sort((a, b) => a.rotatedZ - b.rotatedZ);

      for (const node of orderedNodes) {
        const isCurrent = node.id === currentId;
        const isNext = node.id === nextId;
        const isRecent = recentIds.has(node.id);
        const isFocused = node.cluster === activeCluster;
        const radius = (isCurrent ? 4.6 : isNext ? 3.8 : isFocused ? 2.5 : 1.35) * node.perspective;

        context.save();
        if (isCurrent || isNext) {
          context.shadowBlur = 18;
          context.shadowColor = "rgba(103,232,249,0.95)";
          context.fillStyle = "#cffafe";
        } else if (isRecent) {
          context.shadowBlur = 11;
          context.shadowColor = "rgba(196,181,253,0.75)";
          context.fillStyle = "#c4b5fd";
        } else if (isFocused) {
          context.shadowBlur = 7;
          context.shadowColor = "rgba(167,139,250,0.55)";
          context.fillStyle = "rgba(167,139,250,0.88)";
        } else {
          context.fillStyle = "rgba(99,102,241,0.34)";
        }

        context.beginPath();
        context.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      const source = projectedById.get(currentId);
      const target = projectedById.get(nextId);
      if (source && target) {
        const eased = smoothstep(progress);
        const pulseX = source.screenX + (target.screenX - source.screenX) * eased;
        const pulseY = source.screenY + (target.screenY - source.screenY) * eased;
        const pulseRadius = crossingClusters ? 14 : 10;
        const pulse = context.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, pulseRadius);
        pulse.addColorStop(0, "rgba(255,255,255,1)");
        pulse.addColorStop(0.22, "rgba(103,232,249,0.95)");
        pulse.addColorStop(1, "rgba(103,232,249,0)");
        context.fillStyle = pulse;
        context.beginPath();
        context.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
        context.fill();
      }

      frame = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);
    resize();

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [graph]);

  return (
    <section className="not-prose relative left-1/2 my-14 w-dvw -translate-x-1/2 px-3 sm:px-6">
      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-3xl border border-white/10 bg-[#010104] shadow-2xl shadow-black/30">
        <div className="relative w-full bg-[#010104]">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none cursor-grab active:cursor-grabbing"
            role="img"
            aria-label="Interactive three-dimensional graph traversal showing attention moving through local subgraphs inside a larger brain-like graph"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 text-xs text-white/45">
          <span className="uppercase tracking-[0.18em] text-white/55">Graph traversal</span>
          <span>Drag to rotate · Scroll to zoom</span>
        </div>
      </div>
    </section>
  );
}
