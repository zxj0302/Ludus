import type { Level, LevelConfig } from '@ludus/core';
import { applyMove, meetsGoal, popcount } from './rules';
import { solvePegSolitaire } from './solver';
import { getDifficulty } from './difficulty';
import { CURATED_PEG_PUZZLES, puzzlesForGoal } from './puzzles';
import type { PegGoal, PegSolitaireMove, PegSolitaireState } from './types';

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFromConfig(config: LevelConfig): Rng {
  return mulberry32(config.seed ?? Date.now());
}

function midpoint(range: [number, number]): number {
  return range[0] + (range[1] - range[0]) / 2;
}

export function goalFromDifficultyRange(range: [number, number]): PegGoal {
  const score = midpoint(range);
  if (score <= 33) return 'le3';
  if (score <= 66) return 'one-any';
  return 'one-center';
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function tryRandomDig(state: PegSolitaireState, rng: Rng): PegSolitaireState {
  const removable: number[] = [];
  for (let hole = 0; hole < 33; hole += 1) {
    if (Math.floor(state.pegs / 2 ** hole) % 2 === 1) removable.push(hole);
  }

  if (removable.length <= 4 || rng() < 0.55) return state;

  const hole = removable[Math.floor(rng() * removable.length)]!;
  const pegs = state.pegs - 2 ** hole;
  return { ...state, pegs, status: meetsGoal(pegs, state.goal) ? 'won' : 'playing' };
}

function applyMoves(state: PegSolitaireState, moves: PegSolitaireMove[]): PegSolitaireState {
  return moves.reduce((current, move) => applyMove(current, move), state);
}

function verifiedCandidate(goal: PegGoal, rng: Rng): { state: PegSolitaireState; optimalSteps: number } {
  const pool = puzzlesForGoal(goal);
  const candidates = shuffle(pool.length > 0 ? pool : CURATED_PEG_PUZZLES, rng);

  for (let pass = 0; pass < 2; pass += 1) {
    for (const puzzle of candidates) {
      const state = pass === 0 ? puzzle.state : tryRandomDig(puzzle.state, rng);
      if (state.status !== 'playing') continue;

      const solution = solvePegSolitaire(state, { findShortest: true, timeMs: 1000 });
      if (!solution.solvable) continue;

      const solved = applyMoves(state, solution.moves as PegSolitaireMove[]);
      if (meetsGoal(solved.pegs, state.goal)) {
        return { state, optimalSteps: solution.moves.length };
      }
    }
  }

  const fallback = pool[0] ?? CURATED_PEG_PUZZLES[0]!;
  return { state: fallback.state, optimalSteps: fallback.knownSolutionLength ?? 0 };
}

export function generatePegSolitaireLevel(config: LevelConfig): Level {
  const rng = rngFromConfig(config);
  const goal = goalFromDifficultyRange(config.difficultyRange);
  const { state, optimalSteps } = verifiedCandidate(goal, rng);

  return {
    schemaVersion: 1,
    gameId: 'peg-solitaire',
    levelId: `peg-${goal}-${config.seed ?? Math.floor(rng() * 1_000_000)}`,
    initialState: state as unknown as Record<string, unknown>,
    difficulty: getDifficulty(state),
    optimalSteps,
    uniqueSolution: false,
    generatedBy: 'generatePegSolitaireLevel',
    createdAt: new Date().toISOString(),
  };
}
