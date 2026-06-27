// ============================================================
// GamePluginEntry — games 层扩展插件条目
//
// 比 Core 的 GamePlugin 多一层渲染/UI/i18n 自描述，
// 使 GameShell/EducationPanel 无需认识具体游戏即可工作。
// ============================================================

import type { ComponentType } from 'react';
import type { GamePlugin, GameState, Move, SolverTrace, Solution } from '@ludus/core';

// ---- Board 组件 Props ----

export interface BoardProps<S extends GameState = GameState, M extends Move = Move> {
  state: S;
  onMove: (move: M) => void;
  disabled: boolean;
  highlightCell: HighlightCell | null;
  /** 游戏专属动作分发（loadState, prependHistory 等） */
  dispatch?: (action: { type: string; payload: unknown }) => void;
}

// ---- 高亮坐标 ----

export interface HighlightCell {
  row: number;
  col: number;
  value?: number; // Sudoku 等需要显示数字
}

// ---- UI 扩展 Props ----

export interface ToolbarSlotProps {
  onNewLevel: () => void;
  dispatch?: (action: { type: string; payload: unknown }) => void;
}

export interface StatusExtensionProps {
  state: GameState;
  isWin: boolean;
}

export interface LevelSelectorSlotProps {
  onLoadState: (state: GameState) => void;
}

// ---- 可视化 Props ----

export interface VisualizationProps {
  trace: SolverTrace;
  solution: Solution;
  gameState: GameState;
  isPlaying: boolean;
  stepIndex: number;
}

// ---- GamePluginEntry — 完整插件条目 ----

export interface GamePluginEntry<
  S extends GameState = GameState,
  M extends Move = Move,
> {
  /** Core 逻辑接口 */
  plugin: GamePlugin<S, M>;

  /** Board 渲染组件 */
  BoardComponent: ComponentType<BoardProps<S, M>>;

  /** 类型守卫：校验 GameState 是否属于本游戏 */
  isOwnState(state: GameState): state is S;

  /** 将 move 转换为棋盘高亮坐标（solve/hint 可视化用） */
  moveToHighlight?(move: M, state: S): HighlightCell | null;

  /** 游戏专属 i18n 资源 */
  i18n: {
    namespace: string;
    zhCN: Record<string, string>;
    en: Record<string, string>;
  };

  /** 可选 UI 扩展 */
  ui?: {
    /** 工具栏右侧插槽（难度选择器等） */
    toolbarSlot?: ComponentType<ToolbarSlotProps>;
    /** 状态栏扩展信息 */
    statusExtension?: ComponentType<StatusExtensionProps>;
  };

  /** 可选关卡选择器（Sokoban 等需要） */
  levelSelector?: ComponentType<LevelSelectorSlotProps>;

  /** 教学内容 */
  education: {
    /** depth_locale → raw markdown */
    content: Record<string, string>;
  };

  /** 可视化 */
  visualization?: {
    /** 判断 trace 是否归本游戏处理 */
    matchTrace(trace: SolverTrace): boolean;
    /** 可视化组件 */
    Component: ComponentType<VisualizationProps>;
  };
}
