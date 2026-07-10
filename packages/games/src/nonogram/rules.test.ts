import { describe, it, expect, beforeEach } from 'vitest';
import { computeClues, createInitialState, applyMove, isSolved, totalClueCount } from './rules';
import { EMPTY, FILLED, CROSS } from './types';
import type { NonogramState } from './types';

describe('Nonogram — rules', () => {
  const heart: boolean[][] = [
    [false, true, false, true, false],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [false, true, true, true, false],
    [false, false, true, false, false],
  ];

  describe('computeClues', () => {
    it('computes row and column clues from a pattern', () => {
      const { rowClues, colClues } = computeClues(heart);

      // Row clues for heart pattern
      expect(rowClues[0]).toEqual([1, 1]); // _X_X_
      expect(rowClues[1]).toEqual([5]);     // XXXXX
      expect(rowClues[2]).toEqual([5]);     // XXXXX
      expect(rowClues[3]).toEqual([3]);     // _XXX_
      expect(rowClues[4]).toEqual([1]);     // __X__

      // Column clues
      // col0: F,T,T,F,F → [2]
      expect(colClues[0]).toEqual([2]);
      // col1: T,T,T,T,F → [4]
      expect(colClues[1]).toEqual([4]);
      // col2: F,T,T,T,T → [4]
      expect(colClues[2]).toEqual([4]);
      // col3: T,T,T,T,F → [4]
      expect(colClues[3]).toEqual([4]);
      // col4: F,T,T,F,F → [2]
      expect(colClues[4]).toEqual([2]);
    });

    it('handles all-empty pattern', () => {
      const empty: boolean[][] = [
        [false, false],
        [false, false],
      ];
      const { rowClues, colClues } = computeClues(empty);
      expect(rowClues).toEqual([[], []]);
      expect(colClues).toEqual([[], []]);
    });

    it('handles all-filled pattern', () => {
      const full: boolean[][] = [
        [true, true],
        [true, true],
      ];
      const { rowClues, colClues } = computeClues(full);
      expect(rowClues).toEqual([[2], [2]]);
      expect(colClues).toEqual([[2], [2]]);
    });

    it('handles 1D pattern (single row)', () => {
      const single: boolean[][] = [[true, false, true, true]];
      const { rowClues, colClues } = computeClues(single);
      expect(rowClues[0]).toEqual([1, 2]);
      expect(colClues[0]).toEqual([1]);
      expect(colClues[1]).toEqual([]);
      expect(colClues[2]).toEqual([1]);
      expect(colClues[3]).toEqual([1]);
    });
  });

  describe('totalClueCount', () => {
    it('counts all clue numbers', () => {
      const { rowClues, colClues } = computeClues(heart);
      expect(totalClueCount(rowClues, colClues)).toBeGreaterThan(0);
    });
  });

  describe('createInitialState', () => {
    it('creates state with empty grid', () => {
      const { rowClues, colClues } = computeClues(heart);
      const state = createInitialState(5, 5, rowClues, colClues);

      expect(state.width).toBe(5);
      expect(state.height).toBe(5);
      expect(state.grid).toHaveLength(5);
      for (const row of state.grid) {
        expect(row).toHaveLength(5);
        for (const cell of row) {
          expect(cell).toBe(EMPTY);
        }
      }
    });

    it('clues are deep copies and the answer is not stored in playable state', () => {
      const heartCopy = heart.map(r => [...r]);
      const { rowClues, colClues } = computeClues(heartCopy);
      const state = createInitialState(5, 5, rowClues, colClues);

      rowClues[0]![0] = 999;
      expect(state.rowClues[0]![0]).toBe(1);

      expect('solution' in state).toBe(false);
    });
  });

  describe('applyMove', () => {
    const { rowClues, colClues } = computeClues(heart);
    let state: NonogramState;

    beforeEach(() => {
      state = createInitialState(5, 5, rowClues, colClues);
    });

    it('fill: EMPTY → FILLED', () => {
      const next = applyMove(state, { row: 0, col: 0, action: 'fill' });
      expect(next.grid[0]![0]).toBe(FILLED);
    });

    it('fill: FILLED → EMPTY (toggle)', () => {
      let s = applyMove(state, { row: 0, col: 0, action: 'fill' });
      s = applyMove(s, { row: 0, col: 0, action: 'fill' });
      expect(s.grid[0]![0]).toBe(EMPTY);
    });

    it('cross: EMPTY → CROSS', () => {
      const next = applyMove(state, { row: 0, col: 0, action: 'cross' });
      expect(next.grid[0]![0]).toBe(CROSS);
    });

    it('cross: CROSS → EMPTY (toggle)', () => {
      let s = applyMove(state, { row: 0, col: 0, action: 'cross' });
      s = applyMove(s, { row: 0, col: 0, action: 'cross' });
      expect(s.grid[0]![0]).toBe(EMPTY);
    });

    it('cross: FILLED → CROSS', () => {
      let s = applyMove(state, { row: 0, col: 0, action: 'fill' });
      s = applyMove(s, { row: 0, col: 0, action: 'cross' });
      expect(s.grid[0]![0]).toBe(CROSS);
    });

    it('original state is immutable', () => {
      applyMove(state, { row: 0, col: 0, action: 'fill' });
      expect(state.grid[0]![0]).toBe(EMPTY);
    });
  });

  describe('isSolved', () => {
    const { rowClues, colClues } = computeClues(heart);

    it('empty grid → not solved', () => {
      const state = createInitialState(5, 5, rowClues, colClues);
      expect(isSolved(state)).toBe(false);
    });

    it('exact solution → solved', () => {
      const state = createInitialState(5, 5, rowClues, colClues);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          state.grid[r]![c] = heart[r]![c] ? FILLED : CROSS;
        }
      }
      expect(isSolved(state)).toBe(true);
    });

    it('incorrectly filled grid → not solved', () => {
      const state = createInitialState(5, 5, rowClues, colClues);
      // Fill ALL cells — clearly wrong
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          state.grid[r]![c] = FILLED;
        }
      }
      expect(isSolved(state)).toBe(false);
    });

    it('one missing filled cell → not solved', () => {
      const state = createInitialState(5, 5, rowClues, colClues);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (heart[r]![c]) {
            state.grid[r]![c] = FILLED;
          }
        }
      }
      state.grid[1]![0] = EMPTY; // Should be filled
      expect(isSolved(state)).toBe(false);
    });
  });
});
