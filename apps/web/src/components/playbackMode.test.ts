import { describe, expect, it } from 'vitest';
import type { Solution } from '@ludus/core';
import { shouldPlaySolveErrorSound, shouldRunGenericPlayback } from './playbackMode';

describe('shouldRunGenericPlayback', () => {
  it('runs only for non-adversarial solver playback', () => {
    expect(shouldRunGenericPlayback({ solvePlayback: false, adversarialPlayback: false })).toBe(false);
    expect(shouldRunGenericPlayback({ solvePlayback: true, adversarialPlayback: false })).toBe(true);
    expect(shouldRunGenericPlayback({ solvePlayback: true, adversarialPlayback: true })).toBe(false);
  });
});

describe('shouldPlaySolveErrorSound', () => {
  const timeoutSolution: Solution = {
    solvable: false,
    moves: [],
    stats: {
      nodesExplored: 100,
      timeMs: 5000,
      solutionLength: 0,
      solverName: 'peg-dfs',
      terminated: 'timeout',
    },
  };

  it('plays error for genuine solve failures', () => {
    expect(shouldPlaySolveErrorSound('no path', 'done', null)).toBe(true);
  });

  it('skips error chime on timeout (still shows timedOut copy)', () => {
    expect(shouldPlaySolveErrorSound('timed out', 'done', timeoutSolution)).toBe(false);
  });

  it('skips when solver is not done', () => {
    expect(shouldPlaySolveErrorSound('err', 'running', null)).toBe(false);
  });
});
