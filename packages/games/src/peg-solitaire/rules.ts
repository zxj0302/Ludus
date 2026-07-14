import type { PegGoal, PegSolitaireMove, PegSolitaireState } from './types';
import { CENTER_HOLE, HOLE_COUNT, JUMPS } from './geometry';

export type { PegGoal, PegSolitaireMove, PegSolitaireState };

const GOALS = new Set<PegGoal>(['one-any', 'one-center']);
const STATUSES = new Set<PegSolitaireState['status']>(['playing', 'won', 'stuck']);
const ALL_PEGS = 2 ** HOLE_COUNT - 1;

function bit(hole: number): number {
  return 2 ** hole;
}

function clearPeg(pegs: number, hole: number): number {
  return hasPeg(pegs, hole) ? pegs - bit(hole) : pegs;
}

function setPeg(pegs: number, hole: number): number {
  return hasPeg(pegs, hole) ? pegs : pegs + bit(hole);
}

function isValidHole(hole: number): boolean {
  return Number.isInteger(hole) && hole >= 0 && hole < HOLE_COUNT;
}

function isLegalMove(state: PegSolitaireState, move: PegSolitaireMove): boolean {
  return JUMPS.some(
    jump =>
      jump.from === move.from &&
      jump.over === move.over &&
      jump.to === move.to &&
      hasPeg(state.pegs, move.from) &&
      hasPeg(state.pegs, move.over) &&
      !hasPeg(state.pegs, move.to),
  );
}

function normalizeStatus(pegs: number, goal: PegGoal): PegSolitaireState['status'] {
  if (meetsGoal(pegs, goal)) return 'won';
  if (legalMoves({ pegs, goal, status: 'playing' }).length === 0) return 'stuck';
  return 'playing';
}

export function popcount(pegs: number): number {
  let count = 0;
  let remaining = Math.floor(pegs);

  while (remaining > 0) {
    if (remaining % 2 === 1) count += 1;
    remaining = Math.floor(remaining / 2);
  }

  return count;
}

export function hasPeg(pegs: number, hole: number): boolean {
  if (!isValidHole(hole)) return false;
  return Math.floor(pegs / bit(hole)) % 2 === 1;
}

export function createClassicState(goal: PegGoal): PegSolitaireState {
  const pegs = ALL_PEGS - bit(CENTER_HOLE);
  return {
    pegs,
    goal,
    status: normalizeStatus(pegs, goal),
    catalogId: 'classic-center-vacant',
  };
}

export function legalMoves(state: PegSolitaireState): PegSolitaireMove[] {
  if (state.status !== 'playing') return [];
  return JUMPS.filter(jump => hasPeg(state.pegs, jump.from) && hasPeg(state.pegs, jump.over) && !hasPeg(state.pegs, jump.to));
}

export function applyMove(state: PegSolitaireState, move: PegSolitaireMove): PegSolitaireState {
  if (state.status !== 'playing' || !isLegalMove(state, move)) return state;

  let pegs = state.pegs;
  pegs = clearPeg(pegs, move.from);
  pegs = clearPeg(pegs, move.over);
  pegs = setPeg(pegs, move.to);

  return { pegs, goal: state.goal, status: normalizeStatus(pegs, state.goal), catalogId: state.catalogId };
}

export function meetsGoal(pegs: number, goal: PegGoal): boolean {
  const pegCount = popcount(pegs);
  if (goal === 'one-any') return pegCount === 1;
  return pegCount === 1 && hasPeg(pegs, CENTER_HOLE);
}

export function isSolved(state: PegSolitaireState): boolean {
  return meetsGoal(state.pegs, state.goal);
}

export function isOwnState(state: unknown): state is PegSolitaireState {
  if (typeof state !== 'object' || state === null) return false;
  const candidate = state as Partial<PegSolitaireState>;
  return (
    typeof candidate.pegs === 'number' &&
    Number.isInteger(candidate.pegs) &&
    candidate.pegs >= 0 &&
    candidate.pegs <= ALL_PEGS &&
    GOALS.has(candidate.goal as PegGoal) &&
    STATUSES.has(candidate.status as PegSolitaireState['status'])
  );
}
