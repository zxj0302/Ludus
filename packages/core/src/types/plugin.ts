// ============================================================
// GamePlugin interface v1.0 — 统一游戏插件契约
// 定义于 @ludus/core，所有游戏模块必须实现此接口。
//
// 版本策略：此接口一旦锁定，只能追加可选字段（向后兼容），
// 破坏性修改需升级主版本号并全员迁移。
// ============================================================

// ---- 基础类型别名 ----

/** 游戏唯一标识符 */
export type GameId = string;

/** 渲染后端类型 */
export type RenderBackend = 'dom' | 'canvas';

/** 支持的平台 */
export type Platform = 'web' | 'desktop' | 'mobile';

/** 语言代码 */
export type Locale = 'zh-CN' | 'en';

/** 教育深度层级 */
export type Depth = 'L1' | 'L2' | 'L3';

// ---- 元数据 ----

export interface GameMetadata {
  id: GameId;
  /** 显示名称（i18n key，如 "game.lights-out.name"） */
  nameKey: string;
  /** 一句话描述（i18n key，如 "game.lights-out.description"） */
  descriptionKey: string;
  /** 所属领域（i18n key） */
  category: string;
  /** 游戏图标（emoji），用于 Hub 卡片展示 */
  icon?: string;
  /** 求解器是否瞬时（<1ms），用于 store/UI 决策同步/异步求解策略 */
  isFastSolver?: boolean;
  /** 搜索标签 */
  tags: string[];
  /** 渲染后端 */
  renderBackend: RenderBackend;
  /** 支持的平台及对应能力 */
  platformSupport: PlatformCapability[];
  /** 游戏模块版本号（semver） */
  version: string;
}

// ---- 平台 × 能力 ----

export interface PlatformCapability {
  platform: Platform;
  capabilities: {
    playable: boolean;
    solver: 'full' | 'degraded' | 'unavailable';
    generator: 'full' | 'degraded' | 'unavailable';
    education: 'full' | 'degraded' | 'unavailable';
    visualization: 'full' | 'degraded' | 'unavailable';
    webWorker: boolean;
  };
  /** 降级说明 */
  notes?: string;
}

// ---- 游戏状态与移动 ----

/** 游戏状态（各游戏自行定义具体结构） */
export type GameState = Record<string, unknown>;

/** 一步移动操作（各游戏自行定义具体结构） */
export type Move = Record<string, unknown>;

// ---- 求解结果 ----

export interface Solution {
  /** 当前状态是否可解 */
  solvable: boolean;
  /** 从当前状态到目标状态的操作序列（空数组 = 不可解或已是目标） */
  moves: Move[];
  /** 求解器内部步骤轨迹（供可视化消费） */
  trace?: SolverTrace;
  /** 求解统计 */
  stats: SolutionStats;
}

export interface SolverTrace {
  type: 'search-tree' | 'matrix-transform' | 'constraint-propagation' | 'nim-xor' | 'wythoff-beatty' | 'a-star-search' | 'bfs-state-search' | 'escape-path' | 'minimax-tree' | 'custom';
  steps: TraceStep[];
  /** 附加的可视化数据，各游戏的 visualizationManifest 定义其格式 */
  visualizationData?: unknown;
}

export interface TraceStep {
  /** 步骤描述（i18n key 或英文字面量） */
  description: string;
  /** 步骤特定数据，由 solver 类型化 */
  data: unknown;
}

export interface SolutionStats {
  nodesExplored: number;
  timeMs: number;
  solutionLength: number;
  solverName: string;
  /** 求解器终止原因（用于区分超时 vs 真正无解） */
  terminated?: 'solved' | 'timeout' | 'exhausted';
}

// ---- 难度 ----

export interface Difficulty {
  /** 0（极简）– 100（专家） */
  score: number;
  /** 各维度分解 */
  factors: Record<string, number>;
  /** 人类可读标签（i18n key） */
  labelKey: string;
}

// ---- 关卡 ----

export interface LevelConfig {
  difficultyRange: [number, number];
  size?: number;
  requireUniqueSolution?: boolean;
  requireKnownOptimal?: boolean;
  seed?: number;
  /** 游戏特定参数 */
  gameParams?: Record<string, unknown>;
}

export interface Level {
  schemaVersion: number;
  gameId: GameId;
  levelId: string;
  initialState: GameState;
  difficulty: Difficulty;
  /** 已知最优解步数，null = 未计算 */
  optimalSteps: number | null;
  uniqueSolution: boolean;
  generatedBy: string;
  createdAt: string;
}

// ---- 教学内容清单 ----

export interface EducationManifest {
  gameId: GameId;
  /** L2 内容路径，按语言索引 */
  l2ContentPaths: Record<Locale, string>;
  /** L3 内容路径，按语言索引 */
  l3ContentPaths: Record<Locale, string>;
  /** 适用的抽象问题名称 */
  abstractProblemName: Record<Locale, string>;
  /** 复杂度归类 */
  complexityClass: string;
  /** 知识点标签 */
  knowledgeTags: string[];
}

// ---- 可视化清单 ----

export interface VisualizationManifest {
  gameId: GameId;
  /** 求解器 trace 类型 */
  traceType: SolverTrace['type'];
  /** 可视化组件名（用于动态选择 React Flow / D3 组件） */
  componentName: string;
  /** 使用的可视化库 */
  library: 'react-flow' | 'd3' | 'both' | 'custom-svg';
}

// ============================================================
// GamePlugin — 核心接口
// ============================================================

export interface GamePlugin<
  S extends GameState = GameState,
  M extends Move = Move,
> {
  /** 静态元数据 */
  readonly metadata: GameMetadata;

  // -- 状态与关卡 --
  initialState(): S;
  generateLevel(config: LevelConfig): Level;

  // -- 规则引擎 --
  legalMoves(state: S): M[];
  applyMove(state: S, move: M): S;
  isSolved(state: S): boolean;

  // -- 求解器 --
  solve(state: S): Solution;

  // -- 难度 --
  getDifficulty(state: S): Difficulty;

  // -- 渲染 --
  renderBackend: RenderBackend;

  // -- 教学 --
  educationManifest: EducationManifest;

  // -- 可视化 --
  visualizationManifest: VisualizationManifest;

  // -- AI 对手（可选，Nim/Wythoff 等对抗游戏） --
  /** AI 对手支持 */
  ai?: {
    /** 当前状态是否轮到 AI */
    isAITurn(state: S): boolean;
    /** 获取 AI 走子 + 建议延迟(ms)，null = AI 无法行动 */
    getAIMove(state: S): { move: M; delay: number } | null;
    /** 可选异步 AI 路径，供 Worker 或重搜索游戏避免阻塞 UI */
    getAIMoveAsync?(state: S): Promise<{ move: M; delay: number; tier?: string } | null>;
    /** 人类玩家是否获胜（对抗游戏用于庆祝音效；终局/和棋/AI 胜为 false） */
    isPlayerVictory?(state: S): boolean;
  };
}
