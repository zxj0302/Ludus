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
});
