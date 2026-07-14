import { afterEach, describe, expect, it, vi } from 'vitest';
import { copHasWinningStrategy, searchAdversary } from './adversary';
import { cellIndex } from './rules';
import { generateThiefSiegeLevel } from './generator';
import { shortestEscapePath } from './solver';
import type { ThiefSiegeState } from './types';

afterEach(() => {
  vi.doUnmock('./adversary');
  vi.resetModules();
});

function stateFromSeed(seed: number, difficultyRange: [number, number] = [1, 100]): ThiefSiegeState {
  return generateThiefSiegeLevel({ difficultyRange, seed }).initialState as ThiefSiegeState;
}

function openCellCount(state: ThiefSiegeState): number {
  return state.cells.filter(cell => cell === 'floor' || cell === 'exit').length;
}

describe('generateThiefSiegeLevel', () => {
  it('generated level has escape path from thief to an exit', () => {
    for (let i = 0; i < 20; i++) {
      const state = stateFromSeed(i + 1);
      expect(shortestEscapePath(state)).not.toBeNull();
    }
  });

  it('is deterministic for the same seed and difficulty range', () => {
    const level1 = generateThiefSiegeLevel({ difficultyRange: [34, 66], seed: 12345 });
    const level2 = generateThiefSiegeLevel({ difficultyRange: [34, 66], seed: 12345 });

    expect(level1.initialState).toEqual(level2.initialState);
    expect(level1.difficulty).toEqual(level2.difficulty);
    expect(level1.levelId).toBe(level2.levelId);
  });

  it('starts in cop phase with thief on floor and no cops placed', () => {
    const state = stateFromSeed(42);
    const thiefCell = state.cells[cellIndex(state.width, state.thief.row, state.thief.col)];

    expect(thiefCell).toBe('floor');
    expect(state.phase).toBe('cop');
    expect(state.currentPlayer).toBe(0);
    expect(state.cops).toEqual([]);
    expect(state.status).toBe('playing');
  });

  it('uses the Level shape expected by the plugin system', () => {
    const level = generateThiefSiegeLevel({ difficultyRange: [1, 100], seed: 7 });

    expect(level.schemaVersion).toBe(1);
    expect(level.gameId).toBe('thief-siege');
    expect(level.generatedBy).toBe('generateThiefSiegeLevel');
    expect(level.uniqueSolution).toBe(false);
    expect(level.optimalSteps).toBeNull();
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
  });

  it('maps difficulty tiers to 11 / 15 / 19', () => {
    const easy = stateFromSeed(99, [1, 33]);
    const mid = stateFromSeed(99, [34, 66]);
    const hard = stateFromSeed(99, [67, 100]);

    expect(easy.width).toBe(11);
    expect(easy.height).toBe(11);
    expect(mid.width).toBe(15);
    expect(mid.height).toBe(15);
    expect(hard.width).toBe(19);
    expect(hard.height).toBe(19);
  });

  it('keeps generated tiers substantially more open than corridor templates', () => {
    const cases = [
      { range: [10, 20], minimumOpenCells: 25 },
      { range: [40, 50], minimumOpenCells: 50 },
      { range: [80, 90], minimumOpenCells: 80 },
    ] as const;

    for (const { range, minimumOpenCells } of cases) {
      const state = stateFromSeed(3, [...range]);

      expect(openCellCount(state)).toBeGreaterThanOrEqual(minimumOpenCells);
    }
  });

  it('harder ranges tend toward larger boards and fewer cops', () => {
    const easy = stateFromSeed(99, [1, 33]);
    const hard = stateFromSeed(99, [67, 100]);

    expect(hard.width).toBeGreaterThanOrEqual(easy.width);
    expect(hard.height).toBeGreaterThanOrEqual(easy.height);
    expect(hard.maxCops).toBeLessThanOrEqual(easy.maxCops);
  });

  it('always produces board dimensions in {11, 15, 19}', () => {
    const allowed = new Set([11, 15, 19]);

    for (let seed = 1; seed <= 30; seed++) {
      const state = stateFromSeed(seed);
      expect(allowed.has(state.width)).toBe(true);
      expect(allowed.has(state.height)).toBe(true);
      expect(state.width).toBe(state.height);
    }
  });

  it('clamps config.size into {11, 15, 19}', () => {
    const expectedByRawSize = new Map([
      [7, 11],
      [9, 11],
      [12, 11],
      [20, 19],
    ]);

    for (const [size, expected] of expectedByRawSize) {
      const level = generateThiefSiegeLevel({ difficultyRange: [1, 100], seed: 42, size });
      const state = level.initialState as ThiefSiegeState;
      expect(state.width).toBe(expected);
      expect(state.height).toBe(expected);
      expect(state.width).toBe(state.height);
    }
  });

  it('easy levels pass copHasWinningStrategy under generous budget', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const level = generateThiefSiegeLevel({ difficultyRange: [10, 20], seed });
      const state = level.initialState as ThiefSiegeState;

      expect(state.width).toBe(11);
      expect(shortestEscapePath(state)).not.toBeNull();
      expect(copHasWinningStrategy(state, { timeMs: 2000, maxDepth: Infinity })).toBe(true);
    }
  });

  it('mid/hard openings keep escape path and start in cop phase', () => {
    for (const range of [[40, 50], [80, 90]] as const) {
      const level = generateThiefSiegeLevel({ difficultyRange: [...range], seed: 3 });
      const state = level.initialState as ThiefSiegeState;
      const shallow = searchAdversary(state, { timeMs: 200, maxDepth: 4, maxPlaceBranch: 8 });

      expect(shortestEscapePath(state)).not.toBeNull();
      expect(state.phase).toBe('cop');
      expect(shallow.copWinning).not.toBe(false);
    }
  });

  it('throws instead of returning an ungated fallback when easy templates fail the win gate', async () => {
    vi.doMock('./adversary', async importOriginal => ({
      ...(await importOriginal<typeof import('./adversary')>()),
      copHasWinningStrategy: () => false,
    }));

    const { generateThiefSiegeLevel: generateWithBlockedGate } = await import('./generator');

    expect(() => generateWithBlockedGate({ difficultyRange: [10, 20], seed: 123 })).toThrow(
      /fallback.*win gate/i,
    );
  });
});
