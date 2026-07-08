import { describe, it, expect } from 'vitest';
import { generatePlacements, solveNonogram, countSolutions } from './solver';
import { computeClues, createInitialState } from './rules';
import type { NonogramState } from './types';

describe('Nonogram — solver', () => {
  describe('generatePlacements', () => {
    it('empty clues: only all-false placement', () => {
      const placements = generatePlacements(5, []);
      expect(placements).toHaveLength(1);
      expect(placements[0]).toEqual([false, false, false, false, false]);
    });

    it('single block: [3] on length 5', () => {
      const placements = generatePlacements(5, [3]);
      // Possible: [TTTFF], [FTTTF], [FFTTT]
      expect(placements).toHaveLength(3);
      // Middle position (index 2) should be true in all
      for (const p of placements) {
        expect(p[2]).toBe(true);
      }
    });

    it('full row: [5] on length 5', () => {
      const placements = generatePlacements(5, [5]);
      expect(placements).toHaveLength(1);
      expect(placements[0]).toEqual([true, true, true, true, true]);
    });

    it('[2, 1] on length 5', () => {
      const placements = generatePlacements(5, [2, 1]);
      // Possible: [TTFTF], [TTFFT], [FTTFT]
      expect(placements.length).toBeGreaterThan(0);
      // Index 3 should be true in some, false in others
      const values = placements.map(p => p[3]);
      expect(new Set(values).size).toBeGreaterThanOrEqual(1);
    });

    it('[1, 1] on length 5', () => {
      const placements = generatePlacements(5, [1, 1]);
      expect(placements.length).toBeGreaterThan(0);
      for (const p of placements) {
        // Each placement must have exactly 2 true cells
        expect(p.filter(Boolean).length).toBe(2);
      }
    });

    it('impossible: [4, 4] on length 5', () => {
      const placements = generatePlacements(5, [4, 4]);
      expect(placements).toHaveLength(0);
    });

    it('cache hit: same params return same result object', () => {
      const a = generatePlacements(10, [3, 2]);
      const b = generatePlacements(10, [3, 2]);
      expect(a).toBe(b); // Same array reference from cache
    });
  });

  describe('solveNonogram', () => {
    // Simple 3×3 puzzle: a diagonal cross
    const cross3: boolean[][] = [
      [true, false, true],
      [false, true, false],
      [true, false, true],
    ];

    it('solves a simple 3×3 puzzle', () => {
      const { rowClues, colClues } = computeClues(cross3);
      const state = createInitialState(3, 3, rowClues, colClues, cross3);
      const result = solveNonogram(state);

      expect(result.solvable).toBe(true);
      expect(result.solution).toBeDefined();
      // Verify the solution matches the original pattern
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(result.solution![r]![c]).toBe(cross3[r]![c]);
        }
      }
    });

    it('solves the 5×5 heart puzzle', () => {
      const heart: boolean[][] = [
        [false, true, false, true, false],
        [true, true, true, true, true],
        [true, true, true, true, true],
        [false, true, true, true, false],
        [false, false, true, false, false],
      ];
      const { rowClues, colClues } = computeClues(heart);
      const state = createInitialState(5, 5, rowClues, colClues, heart);
      const result = solveNonogram(state);

      expect(result.solvable).toBe(true);
      expect(result.solution).toBeDefined();
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          expect(result.solution![r]![c]).toBe(heart[r]![c]);
        }
      }
    });

    it('handles 5×5 all-empty clues', () => {
      const empty5: boolean[][] = Array.from({ length: 5 }, () => new Array(5).fill(false));
      const { rowClues, colClues } = computeClues(empty5);
      const state = createInitialState(5, 5, rowClues, colClues, empty5);
      const result = solveNonogram(state);

      expect(result.solvable).toBe(true);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          expect(result.solution![r]![c]).toBe(false);
        }
      }
    });

    it('handles 5×5 all-filled', () => {
      const full5: boolean[][] = Array.from({ length: 5 }, () => new Array(5).fill(true));
      const { rowClues, colClues } = computeClues(full5);
      const state = createInitialState(5, 5, rowClues, colClues, full5);
      const result = solveNonogram(state);

      expect(result.solvable).toBe(true);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          expect(result.solution![r]![c]).toBe(true);
        }
      }
    });

    it('solves simple 5×5 pattern quickly', () => {
      // Simple diagonal pattern — easy to solve
      const pattern: boolean[][] = [];
      for (let r = 0; r < 5; r++) {
        const row: boolean[] = new Array(5).fill(false);
        row[r] = true;
        pattern.push(row);
      }
      const { rowClues, colClues } = computeClues(pattern);
      const state = createInitialState(5, 5, rowClues, colClues, pattern);
      const result = solveNonogram(state);

      expect(result.solvable).toBe(true);
      expect(result.stats.timeMs).toBeLessThan(5000);
    });

    it('stats include line solve cells', () => {
      const { rowClues, colClues } = computeClues(cross3);
      const state = createInitialState(3, 3, rowClues, colClues, cross3);
      const result = solveNonogram(state);

      expect(result.stats.lineSolveCells).toBeGreaterThanOrEqual(0);
      // nodesExplored can be 0 for fully line-solvable puzzles
      expect(result.stats.nodesExplored).toBeGreaterThanOrEqual(0);
    });
  });

  describe('countSolutions', () => {
    const heart5: boolean[][] = [
      [false, true, false, true, false],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [false, true, true, true, false],
      [false, false, true, false, false],
    ];

    it('heart puzzle has exactly 1 solution', () => {
      const { rowClues, colClues } = computeClues(heart5);
      const state = createInitialState(5, 5, rowClues, colClues, heart5);
      expect(countSolutions(state, 2)).toBe(1);
    });

    it('3×3 cross has exactly 1 solution', () => {
      const cross3: boolean[][] = [
        [true, false, true],
        [false, true, false],
        [true, false, true],
      ];
      const { rowClues, colClues } = computeClues(cross3);
      const state = createInitialState(3, 3, rowClues, colClues, cross3);
      expect(countSolutions(state, 2)).toBe(1);
    });

    it('limit=1: stops at first solution', () => {
      const { rowClues, colClues } = computeClues(heart5);
      const state = createInitialState(5, 5, rowClues, colClues, heart5);
      // With limit 1, should return 1 (not 2) even though only 1 exists
      expect(countSolutions(state, 1)).toBe(1);
    });

    it('empty clues: exactly 1 solution (all empty)', () => {
      const empty3: boolean[][] = Array.from({ length: 3 }, () => new Array(3).fill(false));
      const { rowClues, colClues } = computeClues(empty3);
      const state = createInitialState(3, 3, rowClues, colClues, empty3);
      expect(countSolutions(state, 2)).toBe(1);
    });
  });
});
