import type { GameState, Move } from '@ludus/core';

/** Sokoban 游戏状态，紧凑表示以优化 BFS 哈希 */
export interface SokobanState extends GameState {
  width: number;
  height: number;
  /** 玩家位置 { row, col } */
  player: { row: number; col: number };
  /** 墙壁矩阵，true = 墙 */
  walls: boolean[][];
  /** 目标点列表 */
  goals: { row: number; col: number }[];
  /** 箱子位置列表（applyMove 保序，按关卡初始行优先） */
  boxes: { row: number; col: number }[];
}

/** Sokoban 移动：上下左右四方向 */
export interface SokobanMove extends Move {
  direction: 'up' | 'down' | 'left' | 'right';
}

/** 方向向量映射 */
export const DIRECTION_DELTA: Record<SokobanMove['direction'], { dr: number; dc: number }> = {
  up:    { dr: -1, dc:  0 },
  down:  { dr:  1, dc:  0 },
  left:  { dr:  0, dc: -1 },
  right: { dr:  0, dc:  1 },
};
