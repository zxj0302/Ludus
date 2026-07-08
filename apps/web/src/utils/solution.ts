import type { Solution } from '@ludus/core';

/** Extract the `playerStarts` flag from a Solution's visualizationData. */
export function getPlayerStarts(solution: Solution | null): boolean {
  const raw = (solution?.trace?.visualizationData as Record<string, unknown> | undefined)?.playerStarts;
  return typeof raw === 'boolean' ? raw : true;
}
