import type { Difficulty } from '@ludus/core';
import { cellIndex } from './rules';
import { shortestEscapePath } from './solver';
import type { ThiefSiegeState } from './types';

export interface ThiefSiegeDifficultyInput {
  escapeLength: number;
  exitCount: number;
  openCells: number;
  copsPlaced: number;
  maxCops: number;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function labelForScore(score: number): string {
  if (score <= 33) return 'difficulty.easy';
  if (score <= 66) return 'difficulty.medium';
  return 'difficulty.hard';
}

/**
 * Scores how hard the opening is for the cop player.
 *
 * In this game, lower escape distance, more exits, more open space, and fewer
 * available cops all favor the thief, so they increase the difficulty score.
 */
export function computeThiefSiegeDifficulty(input: ThiefSiegeDifficultyInput): Difficulty {
  const escapePressure = input.escapeLength <= 0
    ? 0
    : Math.max(0, 40 - Math.min(input.escapeLength, 12) * 3);
  const exitPressure = Math.min(25, input.exitCount * 2);
  const openness = Math.min(25, input.openCells / 2);
  const copPressure = Math.max(0, 10 - input.maxCops / 2);
  const placedCopAdjustment = Math.min(10, input.copsPlaced * 1.5);

  const score = clampScore(escapePressure + exitPressure + openness + copPressure - placedCopAdjustment);

  return {
    score,
    factors: {
      escapeLength: input.escapeLength,
      exitCount: input.exitCount,
      openCells: input.openCells,
      copsPlaced: input.copsPlaced,
      maxCops: input.maxCops,
    },
    labelKey: labelForScore(score),
  };
}

export function getDifficulty(state: ThiefSiegeState): Difficulty {
  const path = shortestEscapePath(state);
  let exitCount = 0;
  let openCells = 0;

  for (let row = 0; row < state.height; row++) {
    for (let col = 0; col < state.width; col++) {
      const cell = state.cells[cellIndex(state.width, row, col)];
      if (cell === 'exit') exitCount++;
      if (cell === 'floor' || cell === 'exit') openCells++;
    }
  }

  return computeThiefSiegeDifficulty({
    escapeLength: path == null ? 0 : Math.max(0, path.length - 1),
    exitCount,
    openCells,
    copsPlaced: state.cops.length,
    maxCops: state.maxCops,
  });
}
