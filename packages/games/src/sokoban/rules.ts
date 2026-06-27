import {
  legalMoves as coreLegalMoves,
  applyMove as coreApplyMove,
  isSolved as coreIsSolved,
} from './solver-utils';
import { solveSokobanBFS } from './solver';
import type { SokobanState, SokobanMove } from './types';

// ---- 类型重导出（方便 Web 层引用） ----
export type { SokobanState, SokobanMove } from './types';

// ---- 规则引擎（从 core 层直接 re-export） ----
export const legalMoves = coreLegalMoves;
export const applyMove = coreApplyMove;
export const isSolved = coreIsSolved;

// ---- 求解器（直接 re-export core 层，无额外包装） ----
export const solveSokoban = solveSokobanBFS;

// ---- 难度 ----
export { getDifficulty } from './difficulty';
