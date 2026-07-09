import type { Difficulty } from '@ludus/core';
import type { NonogramState, NonogramMove, CellState } from './types';
import { EMPTY, FILLED, CROSS } from './types';
import { computeNonogramDifficulty } from './difficulty';

export type { NonogramState, NonogramMove, CellState };

/**
 * Build clues from a solution pattern.
 * A clue is an array of consecutive filled-run lengths.
 */
export function computeClues(pattern: boolean[][]): { rowClues: number[][]; colClues: number[][] } {
  const height = pattern.length;
  const width = pattern[0]?.length ?? 0;

  const rowClues: number[][] = [];
  for (let r = 0; r < height; r++) {
    const runs: number[] = [];
    let run = 0;
    for (let c = 0; c < width; c++) {
      if (pattern[r]![c]) {
        run++;
      } else {
        if (run > 0) { runs.push(run); run = 0; }
      }
    }
    if (run > 0) runs.push(run);
    rowClues.push(runs);
  }

  const colClues: number[][] = [];
  for (let c = 0; c < width; c++) {
    const runs: number[] = [];
    let run = 0;
    for (let r = 0; r < height; r++) {
      if (pattern[r]![c]) {
        run++;
      } else {
        if (run > 0) { runs.push(run); run = 0; }
      }
    }
    if (run > 0) runs.push(run);
    colClues.push(runs);
  }

  return { rowClues, colClues };
}

/**
 * Count the total number of clue numbers across all rows and columns.
 */
export function totalClueCount(rowClues: number[][], colClues: number[][]): number {
  let total = 0;
  for (const r of rowClues) total += r.length;
  for (const c of colClues) total += c.length;
  return total;
}

export function createInitialState(
  width: number,
  height: number,
  rowClues: number[][],
  colClues: number[][],
  solution: boolean[][],
): NonogramState {
  const grid: CellState[][] = [];
  for (let r = 0; r < height; r++) {
    grid.push(new Array(width).fill(EMPTY));
  }

  return {
    width,
    height,
    grid,
    rowClues: rowClues.map(r => [...r]),
    colClues: colClues.map(c => [...c]),
    solution: solution.map(r => [...r]),
    lineSolveCells: 0,
    maxBacktrackDepth: 0,
  };
}

export function legalMoves(state: NonogramState): NonogramMove[] {
  const moves: NonogramMove[] = [];
  for (let r = 0; r < state.height; r++) {
    for (let c = 0; c < state.width; c++) {
      moves.push({ row: r, col: c, action: 'fill' });
      moves.push({ row: r, col: c, action: 'cross' });
    }
  }
  return moves;
}

export function applyMove(state: NonogramState, move: NonogramMove): NonogramState {
  const { row, col, action } = move;
  const newGrid = state.grid.map(r => [...r]);

  const current = newGrid[row]![col]!;
  if (action === 'fill') {
    // Toggle: EMPTY → FILLED, FILLED → EMPTY, CROSS → FILLED
    newGrid[row]![col] = current === FILLED ? EMPTY : FILLED;
  } else {
    // Toggle: EMPTY → CROSS, CROSS → EMPTY, FILLED → CROSS
    newGrid[row]![col] = current === CROSS ? EMPTY : CROSS;
  }

  return {
    ...state,
    grid: newGrid,
  };
}

export function isSolved(state: NonogramState): boolean {
  const { grid, solution, width, height } = state;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const filled = grid[r]![c] === FILLED;
      const shouldBeFilled = solution[r]![c]!;
      if (filled !== shouldBeFilled) return false;
    }
  }
  return true;
}

export function getDifficulty(state: NonogramState): Difficulty {
  const lineSolveCells = state.lineSolveCells;
  const totalCells = state.width * state.height;
  const maxBacktrackDepth = state.maxBacktrackDepth;
  const clues = totalClueCount(state.rowClues, state.colClues);

  return computeNonogramDifficulty(
    state.width,
    state.height,
    lineSolveCells,
    totalCells,
    maxBacktrackDepth,
    clues,
  );
}
