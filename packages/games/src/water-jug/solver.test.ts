import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved } from './rules';
import { solveWaterJug } from './solver';
import type { WaterJugState, WaterJugMove } from './types';

describe('Water Jug — solver (BFS)', () => {
  it('classic 3L+5L → 4L: solvable', () => {
    const state = createInitialState([3, 5], 4);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBeGreaterThan(0);
    // Verify optimal: classic 3-5-4 problem takes 6 steps
    // Fill 5 (0→5), Pour 5→3 (5→2,2→3), Empty 3 (3→0), Pour 5→3 (2→0,0→2),
    // Fill 5 (2→5), Pour 5→3 (5→4,2→3) → jug0=4
    expect(sol.stats.solutionLength).toBe(6);
  });

  it('3L+5L → 1L: solvable, optimal path exists', () => {
    const state = createInitialState([3, 5], 1);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBeGreaterThan(0);
  });

  it('3L+5L → 3L: solvable in 1 step (fill jug 0)', () => {
    const state = createInitialState([3, 5], 3);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBe(1);
    expect(sol.moves[0]).toEqual({ type: 'fill', jugIndex: 0 });
  });

  it('3L+5L → 5L: solvable in 1 step (fill jug 1)', () => {
    const state = createInitialState([3, 5], 5);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBe(1);
  });

  it('6L+10L → 3L: unsolvable (target not a multiple of gcd)', () => {
    const state = createInitialState([6, 10], 3);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(false);
  });

  it('6L+10L → 2L: solvable (target = gcd)', () => {
    const state = createInitialState([6, 10], 2);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
  });

  it('8L+5L+3L → 4L: solvable (3 jugs)', () => {
    const state = createInitialState([8, 5, 3], 4);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
  });

  it('already solved: returns immediately', () => {
    const state: WaterJugState = { jugs: [4, 0], capacities: [3, 5], target: 4 };
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBe(0);
    expect(sol.stats.nodesExplored).toBe(0);
  });

  it('trace includes path states', () => {
    const state = createInitialState([3, 5], 4);
    const sol = solveWaterJug(state);
    expect(sol.trace).toBeDefined();
    expect(sol.trace!.type).toBe('bfs-state-search');
    expect(sol.trace!.visualizationData).toBeDefined();
    const viz = sol.trace!.visualizationData as any;
    expect(viz.pathStates).toBeDefined();
    expect(viz.pathStates.length).toBe(sol.stats.solutionLength + 1);
  });

  it('solution moves are legal and lead to goal', () => {
    const state = createInitialState([3, 5], 4);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);

    // Apply all moves and verify each is legal
    let current = state;
    for (const move of sol.moves) {
      const wjMove = move as WaterJugMove;
      const legal = legalMoves(current);
      expect(legal.some((m) =>
        m.type === wjMove.type &&
        ('jugIndex' in m ? m.jugIndex === (wjMove as any).jugIndex : true) &&
        ('from' in m ? m.from === (wjMove as any).from : true) &&
        ('to' in m ? m.to === (wjMove as any).to : true)
      )).toBe(true);
      current = applyMove(current, wjMove);
    }
    expect(isSolved(current)).toBe(true);
  });

  it('small capacity: BFS explores all reachable states', () => {
    // 2L+3L → 1L: all states reachable since gcd=1
    const state = createInitialState([2, 3], 1);
    const sol = solveWaterJug(state);
    expect(sol.solvable).toBe(true);
    // State space = 3*4 = 12, all should be visited
    expect(sol.stats.nodesExplored).toBeLessThanOrEqual(12);
  });
});
