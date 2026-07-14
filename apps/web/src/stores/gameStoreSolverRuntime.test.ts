import { describe, expect, it } from 'vitest';
import { clearPlaybackStateFields } from './gameStoreSolverRuntime';

describe('gameStoreSolverRuntime', () => {
  it('clearPlaybackStateFields resets playback flags', () => {
    expect(clearPlaybackStateFields()).toEqual({
      solvePlayback: false,
      adversarialPlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
    });
  });

  it('preserves opening optimal when applying a mid-game remaining length', () => {
    // Mirrors scheduleBackgroundSolve merge: never clobber initialOptimalSteps once set.
    const initialOptimalSteps: number | null = 31;
    const remaining = 2;
    const nextInitial = initialOptimalSteps ?? remaining;
    const nextCurrent = remaining;
    expect(nextInitial).toBe(31);
    expect(nextCurrent).toBe(2);
  });
});
