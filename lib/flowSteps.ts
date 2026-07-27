export function clampStepIndex(index: number, totalSteps: number): number {
  if (index < 0) return 0;
  if (index > totalSteps - 1) return totalSteps - 1;
  return index;
}

export function nextStepIndex(current: number, totalSteps: number): number {
  return clampStepIndex(current + 1, totalSteps);
}

export function previousStepIndex(current: number, totalSteps: number): number {
  return clampStepIndex(current - 1, totalSteps);
}
