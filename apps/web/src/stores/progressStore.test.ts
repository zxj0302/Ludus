import { describe, it, expect } from 'vitest';
import { parseRestorableSnapshot } from '../stores/progressStore';
import type { GameStateSnapshotV1 } from '@ludus/core/schemas';

describe('parseRestorableSnapshot', () => {
  const validSnap: GameStateSnapshotV1 = {
    schemaVersion: 1,
    gameId: 'sudoku',
    state: { grid: [1, 2, 3] },
    moveHistory: [{ grid: [0, 0, 0] }, { grid: [1, 2, 3] }],
    stepCount: 1,
    timestamp: new Date().toISOString(),
  };

  it('returns restored session for valid snapshot', () => {
    const result = parseRestorableSnapshot('sudoku', validSnap);
    expect(result).not.toBeNull();
    expect(result!.historyIndex).toBe(1);
    expect(result!.state).toEqual({ grid: [1, 2, 3] });
  });

  it('rejects mismatched gameId', () => {
    expect(parseRestorableSnapshot('nim', validSnap)).toBeNull();
  });

  it('rejects out-of-range stepCount', () => {
    const bad = { ...validSnap, stepCount: 99 };
    expect(parseRestorableSnapshot('sudoku', bad)).toBeNull();
  });

  it('rejects empty history', () => {
    const bad = { ...validSnap, moveHistory: [], stepCount: 0 };
    expect(parseRestorableSnapshot('sudoku', bad)).toBeNull();
  });
});
