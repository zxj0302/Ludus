import { describe, expect, it } from 'vitest';
import {
  maxDepthToTimeMs,
  resolveConnectFourAiOptions,
  scoreToAiMaxDepth,
} from './difficulty';
import type { ConnectFourState } from './types';
import { createEmptyBoard } from './board';

describe('scoreToAiMaxDepth', () => {
  it('maps easy / medium / hard score bands to search depths', () => {
    expect(scoreToAiMaxDepth(10)).toBe(4);
    expect(scoreToAiMaxDepth(50)).toBe(6);
    expect(scoreToAiMaxDepth(90)).toBe(9);
  });
});

describe('resolveConnectFourAiOptions', () => {
  it('reads aiMaxDepth from state when present', () => {
    const state: ConnectFourState = {
      board: createEmptyBoard(),
      currentPlayer: 0,
      phase: 'choosing',
      winner: null,
      aiMaxDepth: 9,
    };
    expect(resolveConnectFourAiOptions(state)).toEqual({ maxDepth: 9, timeMs: 2_500 });
  });

  it('defaults to medium depth when aiMaxDepth is missing', () => {
    const state: ConnectFourState = {
      board: createEmptyBoard(),
      currentPlayer: 0,
      phase: 'choosing',
      winner: null,
    };
    expect(resolveConnectFourAiOptions(state).maxDepth).toBe(6);
    expect(maxDepthToTimeMs(6)).toBe(1_200);
  });
});
