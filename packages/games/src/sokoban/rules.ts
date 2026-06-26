import type { GameState, Move, Difficulty } from '@ludus/core';
import {
  legalMoves as coreLegalMoves,
  applyMove as coreApplyMove,
  isSolved as coreIsSolved,
  computeSokobanDifficulty,
  solveSokobanBFS,
} from '@ludus/core';
import type { SokobanState, SokobanMove } from '@ludus/core';

// ---- 类型重导出（方便 Web 层引用） ----
export type { SokobanState, SokobanMove } from '@ludus/core';

// ---- 规则引擎（从 core 层直接 re-export） ----
export const legalMoves = coreLegalMoves;
export const applyMove = coreApplyMove;
export const isSolved = coreIsSolved;

// ---- 求解器（直接 re-export core 层，无额外包装） ----
export const solveSokoban = solveSokobanBFS;

// ---- 难度（来自 core 层单一真相源） ----
export const getDifficulty = computeSokobanDifficulty;
