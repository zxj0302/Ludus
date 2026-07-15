import { describe, expect, it } from 'vitest';
import {
  applyMove,
  chooseHand,
  createInitialState,
  isOwnState,
  isPlayerVictory,
  isSolved,
  isTerminalPiles,
  legalMoves,
  legalMovesForPlayer,
  legalSplits,
} from './rules';
import type { GrundysGameState } from './types';

function playing(piles: number[], currentPlayer: 0 | 1 = 0): GrundysGameState {
  return {
    piles,
    currentPlayer,
    initialPiles: [...piles],
    phase: 'playing',
  };
}

describe('legalSplits', () => {
  it('returns empty for heaps that cannot be split', () => {
    expect(legalSplits(1)).toEqual([]);
    expect(legalSplits(2)).toEqual([]);
  });

  it('lists unequal positive parts for n ≥ 3', () => {
    expect(legalSplits(3)).toEqual([1]); // 1+2
    expect(legalSplits(4)).toEqual([1]); // 1+3 (2+2 illegal)
    expect(legalSplits(5)).toEqual([1, 2]); // 1+4, 2+3
    expect(legalSplits(6)).toEqual([1, 2]); // 1+5, 2+4 (3+3 illegal)
  });
});

describe('isTerminalPiles', () => {
  it('is true when every heap is ≤ 2', () => {
    expect(isTerminalPiles([1, 2, 1])).toBe(true);
    expect(isTerminalPiles([2, 2])).toBe(true);
  });

  it('is false when any heap is ≥ 3', () => {
    expect(isTerminalPiles([3, 1])).toBe(false);
    expect(isTerminalPiles([1, 2, 4])).toBe(false);
  });
});

describe('createInitialState / chooseHand', () => {
  it('starts in choosing with multi-heap demo', () => {
    const s = createInitialState();
    expect(s.phase).toBe('choosing');
    expect(s.piles.length).toBeGreaterThanOrEqual(2);
    expect(s.piles.some(n => n >= 3)).toBe(true);
    expect(s.initialPiles).toEqual(s.piles);
  });

  it('enters playing with chosen first player', () => {
    const aiFirst = chooseHand(createInitialState(), false);
    expect(aiFirst.phase).toBe('playing');
    expect(aiFirst.currentPlayer).toBe(1);
  });
});

describe('legalMoves', () => {
  it('enumerates splits across all piles on human turn', () => {
    const moves = legalMoves(playing([3, 4]));
    expect(moves).toEqual([
      { pileIndex: 0, left: 1, right: 2 },
      { pileIndex: 1, left: 1, right: 3 },
    ]);
  });

  it('returns empty on AI turn or terminal position', () => {
    expect(legalMoves(playing([3, 5], 1))).toEqual([]);
    expect(legalMoves(playing([1, 2]))).toEqual([]);
  });

  it('legalMovesForPlayer allows AI moves', () => {
    expect(legalMovesForPlayer(playing([3], 1), 1)).toEqual([{ pileIndex: 0, left: 1, right: 2 }]);
  });
});

describe('applyMove', () => {
  it('replaces a heap with two unequal parts and toggles player', () => {
    const next = applyMove(playing([5, 1]), { pileIndex: 0, left: 2, right: 3 });
    expect(next.piles).toEqual([2, 3, 1]);
    expect(next.currentPlayer).toBe(1);
  });

  it('rejects equal or out-of-range splits', () => {
    const s = playing([4]);
    expect(applyMove(s, { pileIndex: 0, left: 2, right: 2 })).toBe(s); // 2+2 illegal
    expect(applyMove(s, { pileIndex: 0, left: 0, right: 4 })).toBe(s);
  });

  it('marks terminal after last legal split (Nim-style toggle)', () => {
    // [3] → [1,2] terminal; mover was 0, now currentPlayer 1
    const next = applyMove(playing([3]), { pileIndex: 0, left: 1, right: 2 });
    expect(next.piles).toEqual([1, 2]);
    expect(isSolved(next)).toBe(true);
    expect(isPlayerVictory(next)).toBe(true);
  });

  it('isPlayerVictory is false when AI takes the last split', () => {
    const next = applyMove(playing([3], 1), { pileIndex: 0, left: 1, right: 2 });
    expect(isSolved(next)).toBe(true);
    expect(next.currentPlayer).toBe(0);
    expect(isPlayerVictory(next)).toBe(false);
  });
});

describe('isOwnState', () => {
  it('accepts valid grundys states', () => {
    expect(isOwnState(createInitialState())).toBe(true);
  });

  it('rejects foreign shapes', () => {
    expect(isOwnState({ piles: [3], phase: 'playing' })).toBe(false);
    expect(isOwnState({ board: [], phase: 'playing', currentPlayer: 0 })).toBe(false);
  });
});
