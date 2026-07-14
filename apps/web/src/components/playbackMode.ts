import type { Solution } from '@ludus/core';

interface PlaybackMode {
  solvePlayback: boolean;
  adversarialPlayback: boolean;
}

export function shouldRunGenericPlayback(mode: PlaybackMode): boolean {
  return mode.solvePlayback && !mode.adversarialPlayback;
}

/** Timeouts are honest budget limits — show copy, but do not play the error chime. */
export function shouldPlaySolveErrorSound(
  solveError: string | null,
  solverStatus: string,
  solution: Solution | null,
): boolean {
  if (!solveError || solverStatus !== 'done') return false;
  if (solution?.stats.terminated === 'timeout') return false;
  return true;
}
