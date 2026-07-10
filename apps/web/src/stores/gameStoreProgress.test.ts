import { describe, expect, it } from 'vitest';
import { persistGameSession } from './gameStoreProgress';

describe('persistGameSession', () => {
  it('no-ops when required session fields are missing', () => {
    expect(() => persistGameSession({
      gameId: null,
      plugin: null,
      gameState: null,
      history: [],
      historyIndex: 0,
      optimalSteps: null,
      elapsedMs: 0,
    })).not.toThrow();
  });
});
