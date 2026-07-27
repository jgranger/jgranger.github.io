"use client";

import { useEffect, useState } from "react";
import type { FlowData } from "@/types/diagrams";
import {
  clampStepIndex,
  nextStepIndex,
  previousStepIndex,
} from "@/lib/flowSteps";

const AUTO_PLAY_INTERVAL_MS = 2500;

export function AnimatedFlow({ data }: { data: FlowData }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const totalSteps = data.steps.length;
  const currentStep = data.steps[stepIndex];

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= totalSteps - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIndex((i) => nextStepIndex(i, totalSteps));
    }, AUTO_PLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [playing, stepIndex, totalSteps]);

  return (
    <div className="my-8 rounded-lg border border-border p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        {data.nodes.map((node) => (
          <div
            key={node.id}
            data-testid={`flow-node-${node.id}`}
            className={
              currentStep.activeNodes.includes(node.id)
                ? "rounded-md bg-accent text-accent-foreground px-3 py-2 text-p2"
                : "rounded-md bg-muted text-muted-foreground px-3 py-2 text-p2"
            }
          >
            {node.label}
          </div>
        ))}
      </div>

      <p className="text-p1 text-foreground-secondary mb-4" data-testid="flow-step-text">
        {currentStep.text}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex((i) => previousStepIndex(i, totalSteps));
          }}
          disabled={stepIndex === 0}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex((i) => nextStepIndex(i, totalSteps));
          }}
          disabled={stepIndex === totalSteps - 1}
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex(clampStepIndex(0, totalSteps));
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
