import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved, isSolvable, gcd } from './rules';
import type { WaterJugState } from './types';

describe('Water Jug — rules', () => {
  describe('gcd', () => {
    it('gcd(3, 5) = 1', () => { expect(gcd(3, 5)).toBe(1); });
    it('gcd(6, 10) = 2', () => { expect(gcd(6, 10)).toBe(2); });
    it('gcd(8, 12) = 4', () => { expect(gcd(8, 12)).toBe(4); });
    it('gcd(7, 7) = 7', () => { expect(gcd(7, 7)).toBe(7); });
    it('gcd(1, 1) = 1', () => { expect(gcd(1, 1)).toBe(1); });
  });

  describe('isSolvable', () => {
    it('3L+5L → 4L: solvable (gcd=1)', () => {
      expect(isSolvable([3, 5], 4)).toBe(true);
    });
    it('3L+5L → 1L: solvable (gcd=1)', () => {
      expect(isSolvable([3, 5], 1)).toBe(true);
    });
    it('6L+10L → 3L: NOT solvable (gcd=2, 3%2≠0)', () => {
      expect(isSolvable([6, 10], 3)).toBe(false);
    });
    it('6L+10L → 2L: solvable (gcd=2)', () => {
      expect(isSolvable([6, 10], 2)).toBe(true);
    });
    it('3 jugs: 8+5+3 → 4: solvable (gcd=1)', () => {
      expect(isSolvable([8, 5, 3], 4)).toBe(true);
    });
    it('target > max capacity: not solvable', () => {
      expect(isSolvable([3, 5], 6)).toBe(false);
    });
    it('target = 0: always solvable', () => {
      expect(isSolvable([3, 5], 0)).toBe(true);
    });
  });

  describe('createInitialState', () => {
    it('creates state with all jugs empty', () => {
      const state = createInitialState([3, 5], 4);
      expect(state.jugs).toEqual([0, 0]);
      expect(state.capacities).toEqual([3, 5]);
      expect(state.target).toBe(4);
    });
    it('handles 3 jugs', () => {
      const state = createInitialState([8, 5, 3], 4);
      expect(state.jugs).toEqual([0, 0, 0]);
    });
  });

  describe('legalMoves', () => {
    it('initial state: each jug can be filled (not emptied or poured)', () => {
      const state = createInitialState([3, 5], 4);
      const moves = legalMoves(state);
      const types = moves.map(m => m.type);
      expect(types).toContain('fill');
      expect(types).not.toContain('empty');
      expect(types).not.toContain('pour');
      expect(moves.length).toBe(2); // fill jug0, fill jug1
    });

    it('full jug: can only empty or pour out', () => {
      const state: WaterJugState = { jugs: [3, 0], capacities: [3, 5], target: 4 };
      const moves = legalMoves(state);
      expect(moves.some(m => m.type === 'fill' && m.jugIndex === 0)).toBe(false);
      expect(moves.some(m => m.type === 'empty' && m.jugIndex === 0)).toBe(true);
      expect(moves.some(m => m.type === 'pour' && m.from === 0)).toBe(true);
    });

    it('empty jug: can only fill (no empty, no pour out)', () => {
      const state: WaterJugState = { jugs: [0, 0], capacities: [3, 5], target: 4 };
      const moves = legalMoves(state);
      expect(moves.every(m => m.type === 'fill')).toBe(true);
    });

    it('partial state: fill, empty, pour all available', () => {
      const state: WaterJugState = { jugs: [2, 3], capacities: [3, 5], target: 4 };
      const moves = legalMoves(state);
      const types = new Set(moves.map(m => m.type));
      expect(types.has('fill')).toBe(true);
      expect(types.has('empty')).toBe(true);
      expect(types.has('pour')).toBe(true);
    });

    it('both full: only empty available', () => {
      const state: WaterJugState = { jugs: [3, 5], capacities: [3, 5], target: 4 };
      const moves = legalMoves(state);
      expect(moves.every(m => m.type === 'empty')).toBe(true);
    });
  });

  describe('applyMove', () => {
    it('fill: sets jug to capacity', () => {
      const state = createInitialState([3, 5], 4);
      const next = applyMove(state, { type: 'fill', jugIndex: 0 });
      expect(next.jugs[0]).toBe(3);
      expect(next.jugs[1]).toBe(0);
    });

    it('empty: sets jug to 0', () => {
      const state: WaterJugState = { jugs: [3, 5], capacities: [3, 5], target: 4 };
      const next = applyMove(state, { type: 'empty', jugIndex: 0 });
      expect(next.jugs[0]).toBe(0);
    });

    it('pour: transfers water correctly', () => {
      const state: WaterJugState = { jugs: [3, 0], capacities: [3, 5], target: 4 };
      const next = applyMove(state, { type: 'pour', from: 0, to: 1 });
      expect(next.jugs[0]).toBe(0);
      expect(next.jugs[1]).toBe(3);
    });

    it('pour: stops when destination is full', () => {
      const state: WaterJugState = { jugs: [3, 4], capacities: [3, 5], target: 4 };
      const next = applyMove(state, { type: 'pour', from: 0, to: 1 });
      expect(next.jugs[0]).toBe(2); // only 1 fits
      expect(next.jugs[1]).toBe(5); // full
    });

    it('pour: does nothing when source is empty', () => {
      const state: WaterJugState = { jugs: [0, 0], capacities: [3, 5], target: 4 };
      const next = applyMove(state, { type: 'pour', from: 0, to: 1 });
      expect(next.jugs).toEqual([0, 0]);
    });

    it('state immutability: original state unchanged', () => {
      const state = createInitialState([3, 5], 4);
      const next = applyMove(state, { type: 'fill', jugIndex: 0 });
      expect(state.jugs[0]).toBe(0); // original unchanged
      expect(next.jugs[0]).toBe(3);
    });
  });

  describe('isSolved', () => {
    it('target in jug 0: solved', () => {
      const state: WaterJugState = { jugs: [4, 0], capacities: [3, 5], target: 4 };
      expect(isSolved(state)).toBe(true);
    });

    it('target in jug 1: solved', () => {
      const state: WaterJugState = { jugs: [0, 4], capacities: [3, 5], target: 4 };
      expect(isSolved(state)).toBe(true);
    });

    it('no jug has target: not solved', () => {
      const state: WaterJugState = { jugs: [3, 2], capacities: [3, 5], target: 4 };
      expect(isSolved(state)).toBe(false);
    });

    it('empty state: not solved (target > 0)', () => {
      const state = createInitialState([3, 5], 4);
      expect(isSolved(state)).toBe(false);
    });

    it('3 jugs: target can be in any jug', () => {
      const state: WaterJugState = { jugs: [0, 0, 4], capacities: [8, 5, 3], target: 4 };
      expect(isSolved(state)).toBe(true);
    });
  });
});
