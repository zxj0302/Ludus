import { describe, it, expect } from 'vitest';
import { solveFifteen, manhattanDistance } from './solver';
import { GOAL_GRID } from './types';
import type { FifteenState } from './types';

describe('Fifteen solver', () => {
  it('manhattanDistance is 0 for solved state', () => {
    expect(manhattanDistance(GOAL_GRID)).toBe(0);
  });

  it('manhattanDistance correct for one tile displaced', () => {
    // Swap 1 and 2: [2,1,3,4,5,...]
    const grid = [...GOAL_GRID];
    grid[0] = 2;
    grid[1] = 1;
    // 2 at (0,0) should be at (0,1): dist=1. 1 at (0,1) should be at (0,0): dist=1. Total=2
    expect(manhattanDistance(grid)).toBe(2);
  });

  it('manhattanDistance correct for tile at opposite corner', () => {
    // 1 at (3,3) instead of (0,0): dist=6
    const grid = [...GOAL_GRID];
    grid[15] = 1;
    grid[0] = 0; // empty now at (0,0)
    // 1 at (3,3) should be at (0,0): |3-0|+|3-0|=6
    expect(manhattanDistance(grid)).toBe(6);
  });

  it('solves already-solved state', () => {
    const state: FifteenState = { grid: [...GOAL_GRID] };
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves).toHaveLength(0);
    expect(sol.stats.solutionLength).toBe(0);
  });

  it('solves one-move scramble', () => {
    // Slide tile 15 (at index 14) into empty (at index 15)
    const grid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
    const state: FifteenState = { grid };
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves).toHaveLength(1);
    expect(sol.moves[0]!.tileIndex).toBe(15);
    expect(sol.stats.terminated).toBe('solved');
    expect(sol.trace!.type).toBe('a-star-search');
  });

  it('solves two-move scramble', () => {
    // 2 moves from solved: empty=15→14→13 produces [1,2,3,4,5,6,7,8,9,10,11,12,13,0,14,15]
    const grid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 0, 14, 15];
    const state: FifteenState = { grid };
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBeGreaterThanOrEqual(2);
  });

  it('solves 1-move scramble within reasonable nodes', () => {
    const easy: FifteenState = {
      grid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15],
    };
    const sol = solveFifteen(easy);
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBe(1);
    expect(sol.stats.nodesExplored).toBeLessThan(100);
  });

  it('trace contains path nodes with f/g/h', () => {
    // Slide tile 15 (at index 14) into empty (at index 15)
    const grid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
    const state: FifteenState = { grid };
    const sol = solveFifteen(state);
    expect(sol.trace).toBeDefined();
    expect(sol.trace!.type).toBe('a-star-search');
    expect(sol.trace!.steps.length).toBeGreaterThan(0);
    const lastStep = sol.trace!.steps[sol.trace!.steps.length - 1]!;
    expect(lastStep.data).toHaveProperty('g');
    expect(lastStep.data).toHaveProperty('h');
    expect(lastStep.data).toHaveProperty('f');
  });
});
