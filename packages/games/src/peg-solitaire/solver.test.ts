import { describe, expect, it } from 'vitest';
import { CENTER_HOLE, HOLE_COORDS } from './geometry';
import { applyMove, createClassicState, hasPeg, isSolved, popcount } from './rules';
import { canonicalKey, solvePegSolitaire } from './solver';
import type { PegSolitaireMove, PegSolitaireState } from './types';

function bit(hole: number): number {
  return 2 ** hole;
}

const HOLE_BY_COORD = new Map(HOLE_COORDS.map((coord, hole) => [`${coord.row},${coord.col}`, hole]));

function transformPegs(pegs: number, transform: (row: number, col: number) => { row: number; col: number }): number {
  let transformed = 0;

  for (let hole = 0; hole < HOLE_COORDS.length; hole += 1) {
    if (!hasPeg(pegs, hole)) continue;
    const coord = HOLE_COORDS[hole]!;
    const next = transform(coord.row, coord.col);
    const nextHole = HOLE_BY_COORD.get(`${next.row},${next.col}`);
    if (nextHole === undefined) throw new Error(`D4 transform escaped board at ${next.row},${next.col}`);
    transformed += bit(nextHole);
  }

  return transformed;
}

function applyMoves(state: PegSolitaireState, moves: PegSolitaireMove[]): PegSolitaireState {
  return moves.reduce((current, move) => applyMove(current, move), state);
}

describe('Peg Solitaire D4 solver', () => {
  it('canonicalKey is invariant under rotations and reflections', () => {
    const pegs = bit(0) + bit(4) + bit(13) + bit(CENTER_HOLE) + bit(25) + bit(32);
    const variants = [
      pegs,
      transformPegs(pegs, (row, col) => ({ row: col, col: 6 - row })),
      transformPegs(pegs, (row, col) => ({ row: 6 - row, col: 6 - col })),
      transformPegs(pegs, (row, col) => ({ row: 6 - col, col: row })),
      transformPegs(pegs, (row, col) => ({ row, col: 6 - col })),
      transformPegs(pegs, (row, col) => ({ row: 6 - row, col })),
      transformPegs(pegs, (row, col) => ({ row: col, col: row })),
      transformPegs(pegs, (row, col) => ({ row: 6 - col, col: 6 - row })),
    ];

    const keys = variants.map(canonicalKey);

    expect(new Set(keys).size).toBe(1);
  });

  it('solves a handcrafted three-move micro puzzle', () => {
    const state: PegSolitaireState = {
      pegs: bit(4) + bit(14) + bit(15) + bit(23),
      goal: 'one-center',
      status: 'playing',
    };

    const solution = solvePegSolitaire(state, { findShortest: true, timeMs: 1000 });
    const solved = applyMoves(state, solution.moves as PegSolitaireMove[]);

    expect(solution.solvable).toBe(true);
    expect(solution.moves).toHaveLength(3);
    expect(solution.stats.solverName).toContain('+D4');
    expect(solution.trace?.type).toBe('search-tree');
    expect(popcount(solved.pegs)).toBe(1);
    expect(isSolved(solved)).toBe(true);
    expect(hasPeg(solved.pegs, CENTER_HOLE)).toBe(true);
  });

  it('starts searching the classic board without throwing when budgeted', () => {
    const state = createClassicState('one-center');

    const solution = solvePegSolitaire(state, { timeMs: 1 });

    expect(solution.trace?.type).toBe('search-tree');
    expect(solution.stats.solverName).toContain('+D4');
    expect(solution.stats.nodesExplored).toBeGreaterThanOrEqual(0);
  });
});
