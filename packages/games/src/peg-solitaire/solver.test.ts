import { describe, expect, it } from 'vitest';
import { CENTER_HOLE, HOLE_COORDS, holeNotation } from './geometry';
import { applyMove, createClassicState, hasPeg, isSolved, popcount } from './rules';
import { canonicalKey, sampleSolutionTree, solvePegSolitaire } from './solver';
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
  it('uses English algebraic hole notation (center = d4)', () => {
    expect(holeNotation(CENTER_HOLE)).toBe('d4');
    expect(holeNotation(0)).toBe('c1');
    expect(holeNotation(32)).toBe('e7');
    expect(HOLE_COORDS).toHaveLength(33);
  });

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

    const tree = sampleSolutionTree(state, solution.moves as PegSolitaireMove[]);
    const pathNodes = tree.filter(n => n.onPath);
    const branchNodes = tree.filter(n => !n.onPath && n.parentId);
    expect(pathNodes).toHaveLength(4); // root + 3 moves
    expect(branchNodes.length).toBeGreaterThan(0);
    expect(tree.every(n => n.id.startsWith('n'))).toBe(true);
    const vizTree = (solution.trace?.visualizationData as { treeNodes?: unknown[] } | undefined)?.treeNodes;
    expect(Array.isArray(vizTree)).toBe(true);
    expect((vizTree?.length ?? 0)).toBeGreaterThan(pathNodes.length - 1);
  });

  it('starts searching the classic board without throwing when budgeted', () => {
    const state = createClassicState('one-center');

    const solution = solvePegSolitaire(state, { timeMs: 1 });

    expect(solution.trace?.type).toBe('search-tree');
    expect(solution.stats.solverName).toContain('+D4');
    expect(solution.stats.nodesExplored).toBeGreaterThanOrEqual(0);
  });
});
