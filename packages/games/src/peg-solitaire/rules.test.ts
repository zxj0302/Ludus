import { describe, expect, it } from 'vitest';
import { CENTER_HOLE, JUMPS } from './geometry';
import {
  applyMove,
  createClassicState,
  hasPeg,
  isOwnState,
  isSolved,
  legalMoves,
  meetsGoal,
  popcount,
} from './rules';
import type { PegSolitaireState } from './types';

function bit(hole: number): number {
  return 2 ** hole;
}

describe('Peg Solitaire rules', () => {
  it('classic start has 32 pegs and an empty center', () => {
    const state = createClassicState('one-center');

    expect(popcount(state.pegs)).toBe(32);
    expect(hasPeg(state.pegs, CENTER_HOLE)).toBe(false);
    expect(state.status).toBe('playing');
  });

  it('precomputes standard jumps and exposes legal opening moves', () => {
    const state = createClassicState('one-center');
    const moves = legalMoves(state);

    expect(JUMPS).toHaveLength(76);
    expect(moves).toHaveLength(4);
    expect(moves).toEqual(
      expect.arrayContaining([
        { from: 4, over: 9, to: CENTER_HOLE },
        { from: 14, over: 15, to: CENTER_HOLE },
        { from: 18, over: 17, to: CENTER_HOLE },
        { from: 28, over: 23, to: CENTER_HOLE },
      ]),
    );
  });

  it('applyMove clears from and over holes and fills the destination', () => {
    const state = createClassicState('one-center');
    const move = { from: 4, over: 9, to: CENTER_HOLE };
    const next = applyMove(state, move);

    expect(hasPeg(next.pegs, move.from)).toBe(false);
    expect(hasPeg(next.pegs, move.over)).toBe(false);
    expect(hasPeg(next.pegs, move.to)).toBe(true);
    expect(popcount(next.pegs)).toBe(31);
  });

  it('one-center goal wins only with a single peg at the center', () => {
    const centerWin: PegSolitaireState = { pegs: bit(CENTER_HOLE), goal: 'one-center', status: 'playing' };
    const offCenterWin: PegSolitaireState = { pegs: bit(0), goal: 'one-center', status: 'playing' };

    expect(meetsGoal(centerWin.pegs, centerWin.goal)).toBe(true);
    expect(isSolved(centerWin)).toBe(true); // status may lag; goal is authoritative
    expect(isSolved({ ...centerWin, status: 'won' })).toBe(true);
    expect(meetsGoal(offCenterWin.pegs, offCenterWin.goal)).toBe(false);
    expect(isSolved(offCenterWin)).toBe(false);
  });

  it('marks a non-winning board as stuck when a jump leaves an off-center singleton', () => {
    const state: PegSolitaireState = { pegs: bit(0) + bit(1), goal: 'one-center', status: 'playing' };
    const next = applyMove(state, { from: 0, over: 1, to: 2 });

    expect(next.status).toBe('stuck');
    expect(popcount(next.pegs)).toBe(1);
    expect(legalMoves(next)).toEqual([]);
    expect(isSolved(next)).toBe(false);
  });

  it('ignores illegal moves without rewriting history-facing state identity', () => {
    const state = createClassicState('one-center');
    const illegal = { from: 0, over: 1, to: 2 };

    expect(applyMove(state, illegal)).toBe(state);
  });

  it('recognizes owned states conservatively', () => {
    expect(isOwnState(createClassicState('one-center'))).toBe(true);
    expect(isOwnState({ pegs: 2 ** 33, goal: 'one-any', status: 'playing' })).toBe(false);
    expect(isOwnState({ pegs: 1, goal: 'le3', status: 'playing' })).toBe(false);
    expect(isOwnState({ pegs: 1, goal: 'center', status: 'playing' })).toBe(false);
  });

  it('one-any accepts any singleton but one-center does not', () => {
    expect(meetsGoal(bit(0), 'one-any')).toBe(true);
    expect(meetsGoal(bit(0), 'one-center')).toBe(false);
    expect(meetsGoal(bit(CENTER_HOLE), 'one-center')).toBe(true);
  });
});
