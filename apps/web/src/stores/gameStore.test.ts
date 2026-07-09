import { describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore generator params', () => {
  it('does not apply Create-card advanced params to default toolbar generation', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    store.setGeneratorParam('lights-out', 'size', 3);
    store.newLevel();

    const state = useGameStore.getState().gameState as { n: number; grid: number[] };

    expect(state.n).toBe(5);
    expect(state.grid).toHaveLength(25);
  });

  it('passes advanced generator params into explicit advanced generation', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    store.setGeneratorParam('lights-out', 'size', 3);
    store.setGeneratorParam('lights-out', 'minMoves', 2);
    store.setGeneratorParam('lights-out', 'maxMoves', 2);
    store.setGeneratorParam('lights-out', 'requireUniqueSolution', true);
    store.setGeneratorParam('lights-out', 'requireKnownOptimal', false);
    store.newLevel({ useGeneratorParams: true });

    const state = useGameStore.getState().gameState as { n: number; grid: number[] };
    const level = useGameStore.getState().lastGeneratedLevel;

    expect(state.n).toBe(3);
    expect(state.grid).toHaveLength(9);
    expect(level?.gameId).toBe('lights-out');
    expect(level?.uniqueSolution).toBe(true);
  });
});
