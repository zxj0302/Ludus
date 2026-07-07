# 阶段 2 — 架构设计（系统架构师角色）

> 产出日期：2026-06-25
> 状态：✅ 已确认
> **修订 2026-06-27**：经 ADR-023 重构，包结构从 9 个简化为 4 个（core/games/education/ui）+ apps/web。Core 不再包含 solver/generator/difficulty，全部迁入各游戏目录。详见 §2.3 包清单。
> 关联决策：ADR-001~023

---

## 1. 分层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  apps/web (Vite+React)  apps/desktop (Tauri)  apps/mobile   │
│                           (Capacitor)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                packages/ui                            │   │
│  │  GameToolbar  GameStatusBar  ProgressiveDisclosure    │   │
│  │  MarkdownRenderer  ErrorBoundary                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  (viz 组件在 apps/web 按 trace.type 懒加载，不独立成包)     │
│  (i18n 字符串归入各游戏目录，共享 key 在 apps/web)          │
├─────────────────────────────────────────────────────────────┤
│                    EDUCATION LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              packages/education                       │   │
│  │  content/  — 各游戏教学内容 .md 文件                  │   │
│  │  lights-out/  sudoku/  nim/  wythoff/  sokoban/      │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    GAME MODULE LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              packages/games                           │   │
│  │  GamePluginEntry interface — 全自包含插件入口          │   │
│  │  每游戏 = 一个自包含目录 (types/rules/solver/         │   │
│  │  generator/difficulty/render/manifest/i18n)            │   │
│  │  ├── lights-out/  sokoban/  sudoku/  nim/  wythoff/   │   │
│  │  registry.ts  — 动态注册/发现, 新增游戏=加一行        │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    CORE LOGIC LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              packages/core                            │   │
│  │  ┌──────────────────┐  ┌──────────────────┐          │   │
│  │  │  types/           │  │  schemas/         │          │   │
│  │  │  GamePlugin       │  │  LevelSchema      │          │   │
│  │  │  Solution         │  │  StateSchema      │          │   │
│  │  │  Difficulty       │  │  EducationSchema  │          │   │
│  │  └──────────────────┘  │  Migrator         │          │   │
│  │                         └──────────────────┘          │   │
│  │  ┌──────────────────┐                                │   │
│  │  │  worker/          │                                │   │
│  │  │  messages         │                                │   │
│  │  └──────────────────┘                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  框架无关 · 零 UI 依赖 · 纯 TS · Node/Worker 可运行        │
│  零游戏专属代码 — 求解器/生成器/难度全部在各游戏目录       │
└─────────────────────────────────────────────────────────────┘

依赖方向（严格单向）：
  Presentation ──→ Game Module ──→ Core
       │               │
       └───────────────┘  (可直接引用 Core 类型)
  Education 层为纯内容(.md)，被 Presentation 静态 import
```

### 依赖规则

| 规则                                     | 说明                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------- |
| **Core → 无**                     | Core 不依赖任何其他包，纯 TS + 零外部运行时依赖（除 zod 用于 schema） |
| **Game Module → Core**            | 每个游戏实现 Core 定义的 GamePlugin 接口，引用 Core 类型/Schema       |
| **Education → Core**              | 纯内容(.md 文件)，被 web 层静态 import，与代码解耦                    |
| **UI → Game Module + Core**       | 共享布局组件调用 GamePluginEntry，直接引用 Core 类型                  |
| **Apps → UI + Games + Education** | 组装层，注册游戏、合并 i18n、加载可视化、不含业务逻辑                 |

---

## 2. 模块依赖图与 Monorepo 配置

### 2.1 包依赖关系图 (packages)

```
                    ┌─────────────┐
                    │  apps/web   │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   @ludus/   │ │   @ludus/   │ │   @ludus/   │
    │     ui      │ │    games    │ │  education  │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
           └───────┬───────┘
                   │
            ┌──────▼──────┐
            │   @ludus/   │
            │    core     │
            └─────────────┘
```

### 2.2 pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### 2.3 包清单与职责

| 包名                 | 目录                   | 职责                                                                                                                                 | 依赖                                  |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `@ludus/core`      | `packages/core`      | 类型定义(GamePlugin/Level/State/Solution)、Zod Schema、版本化 Migrator、Worker 消息协议。**零游戏专属代码**。                  | 仅 zod                                |
| `@ludus/games`     | `packages/games`     | 各游戏模块（每游戏自包含 types/rules/solver/generator/difficulty/render/manifest/i18n）、GamePluginEntry 注册表、共享类型 BoardProps | `@ludus/core`、react、framer-motion |
| `@ludus/education` | `packages/education` | 教学内容 Markdown 文件（L2/L3 × zh-CN/en），通过 Vite ?raw import 加载                                                              | `@ludus/core`                       |
| `@ludus/ui`        | `packages/ui`        | React 组件库：GameToolbar、GameStatusBar、ProgressiveDisclosure、ErrorBoundary、MarkdownRenderer                                     | `@ludus/core`、react                |
| `ludus-web`        | `apps/web`           | Vite + React SPA，静态部署入口。组装层：i18n init、教育内容注册、可视化组件注册、GameShell/SokobanToolbar                            | 所有 packages                         |
| `ludus-desktop`    | `apps/desktop`       | Tauri 壳，内嵌 Web，可选原生 API 调用（阶段 6）                                                                                      | `ludus-web` (复用)                  |
| `ludus-mobile`     | `apps/mobile`        | Capacitor 壳，内嵌 Web（阶段 6）                                                                                                     | `ludus-web` (复用)                  |

> **2026-06-27 更新**：`packages/i18n`、`packages/viz` 已移除（空壳包）。i18n 字符串归入各游戏目录，viz 组件在 web 层按 trace.type 懒加载。

---

## 3. 统一游戏插件接口契约 v1.0

> 定义于 `packages/core/src/types/plugin.ts`。所有游戏模块必须实现此接口。

```typescript
// ============================================================
// GamePlugin interface v1.0
// 语义版本：此接口一旦锁定，只能追加可选字段（向后兼容），
// 破坏性修改需升级主版本号并全员迁移。
// ============================================================

import { z } from 'zod';

// ---- 基础类型 ----

/** 游戏唯一标识 */
export type GameId = string; // e.g. "lights-out", "sudoku", "nim"

/** 渲染后端类型 */
export type RenderBackend = 'dom' | 'canvas';

/** 支持的平台 */
export type Platform = 'web' | 'desktop' | 'mobile';

/** 语言 */
export type Locale = 'zh-CN' | 'en';

/** 教育深度 */
export type Depth = 'L1' | 'L2' | 'L3';

// ---- 元数据 ----

export interface GameMetadata {
  id: GameId;
  /** 显示名称（i18n key） */
  nameKey: string;
  /** 一句话描述（i18n key） */
  descriptionKey: string;
  /** 所属领域（用于分类浏览） */
  category: string; // e.g. "linear-algebra", "csp", "combinatorial-game"
  /** 标签（用于搜索） */
  tags: string[];
  /** 渲染后端 */
  renderBackend: RenderBackend;
  /** 支持的平台及能力 */
  platformSupport: PlatformCapability[];
  /** 版本 */
  version: string; // semver
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
  notes?: string;
}

// ---- 游戏状态 ----

/** 游戏状态（不透明，由各游戏定义） */
export type GameState = Record<string, unknown>;

/** 一步移动 */
export type Move = Record<string, unknown>;

/** 求解结果 */
export interface Solution {
  /** 是否可解 */
  solvable: boolean;
  /** 从当前状态到目标状态的操作序列 */
  moves: Move[];
  /** 求解器内部步骤轨迹（供可视化消费） */
  trace?: SolverTrace;
  /** 求解统计 */
  stats: SolutionStats;
}

export interface SolverTrace {
  type: 'search-tree' | 'matrix-transform' | 'constraint-propagation' | 'custom';
  steps: TraceStep[];
  /** 附加的可视化数据（每个游戏的 visualizationManifest 定义其格式） */
  visualizationData?: unknown;
}

export interface TraceStep {
  description: string; // i18n key or literal (en fallback)
  data: unknown; // step-specific data, typed by solver
}

export interface SolutionStats {
  nodesExplored: number;
  timeMs: number;
  solutionLength: number;
  solverName: string;
}

// ---- 难度 ----

export interface Difficulty {
  /** 难度分 0(极简)–100(专家) */
  score: number;
  /** 各维度的分解 */
  factors: Record<string, number>;
  /** 人类可读的难度标签（i18n key） */
  labelKey: string;
}

// ---- 关卡 ----

/** 关卡配置（生成器入参） */
export interface LevelConfig {
  /** 难度范围 [min, max] */
  difficultyRange: [number, number];
  /** 棋盘/规模参数 */
  size?: number;
  /** 是否要求唯一解 */
  requireUniqueSolution?: boolean;
  /** 是否要求已知最优解 */
  requireKnownOptimal?: boolean;
  /** 随机种子（可复现生成） */
  seed?: number;
  /** 游戏特定参数 */
  gameParams?: Record<string, unknown>;
}

/** 完整关卡数据（序列化为 JSON） */
export interface Level {
  schemaVersion: number;
  gameId: GameId;
  levelId: string;
  initialState: GameState;
  difficulty: Difficulty;
  /** 最优解步数（若已知），null 表示未计算 */
  optimalSteps: number | null;
  /** 是否已验证唯一解 */
  uniqueSolution: boolean;
  /** 生成器类型 */
  generatedBy: string;
  createdAt: string; // ISO 8601
}

// ---- 教学内容清单 ----

export interface EducationManifest {
  gameId: GameId;
  /** L2 内容文件路径（相对于 education 包） */
  l2ContentPaths: Record<Locale, string>;
  /** L3 内容文件路径 */
  l3ContentPaths: Record<Locale, string>;
  /** 适用的抽象问题名（e.g. "Linear Equations over GF(2)"） */
  abstractProblemName: Record<Locale, string>;
  /** 复杂度归类 */
  complexityClass: string; // e.g. "P", "NP-complete", "PSPACE"
  /** 知识点标签 */
  knowledgeTags: string[];
}

// ---- 可视化清单 ----

export interface VisualizationManifest {
  gameId: GameId;
  /** 求解器输出的 trace.type */
  traceType: SolverTrace['type'];
  /** 可视化组件名（用于动态选择 React Flow / D3 组件） */
  componentName: string;
  /** 可视化库 */
  library: 'react-flow' | 'd3' | 'both';
}

// ============================================================
// GamePlugin — 核心接口
// ============================================================

export interface GamePlugin<S extends GameState = GameState, M extends Move = Move> {
  /** 元数据（静态，编译时常量） */
  readonly metadata: GameMetadata;

  // -- 状态与关卡 --
  /** 返回初始状态（默认关卡） */
  initialState(): S;
  /** 根据配置生成关卡 */
  generateLevel(config: LevelConfig): Level;

  // -- 规则引擎 --
  /** 返回当前状态的所有合法走子 */
  legalMoves(state: S): M[];
  /** 对状态应用一步走子（不可变：返回新状态） */
  applyMove(state: S, move: M): S;
  /** 判断是否已胜利 */
  isSolved(state: S): boolean;

  // -- 求解器 --
  /** 从给定状态求解，返回最优/任一解 */
  solve(state: S): Solution;

  // -- 难度 --
  /** 评估当前状态的难度 */
  getDifficulty(state: S): Difficulty;

  // -- 对抗游戏 AI（可选，Nim/Wythoff 等双人对弈游戏） --
  ai?: {
    /** 当前是否 AI 的回合 */
    isAITurn(state: S): boolean;
    /** 获取 AI 走子 + 建议延迟，null = AI 不动作 */
    getAIMove(state: S): { move: M; delay: number } | null;
  };

  // -- 渲染 hooks（各游戏自行决定如何渲染棋盘） --
  /** 渲染后端声明（与 metadata.renderBackend 一致） */
  renderBackend: RenderBackend;

  // -- 教学内容 --
  /** 教学内容清单 */
  educationManifest: EducationManifest;

  // -- 可视化 --
  /** 算法可视化清单 */
  visualizationManifest: VisualizationManifest;
}

// ============================================================
// GamePluginEntry — 全自包含插件入口（packages/games/src/types.ts）
// ============================================================

/** 扩展的插件条目，包含 Core 的 GamePlugin + 渲染/UI/i18n/教育/可视化自描述 */
export interface GamePluginEntry<S extends GameState = GameState, M extends Move = Move> {
  plugin: GamePlugin<S, M>;
  BoardComponent: React.ComponentType<BoardProps<S, M>>;
  isOwnState(state: GameState): state is S;
  moveToHighlight?(move: M, state: S): HighlightCell | null;
  i18n: { namespace: string; zhCN: Record<string, string>; en: Record<string, string> };
  ui?: { toolbarSlot?: React.ComponentType<ToolbarSlotProps>; statusExtension?: React.ComponentType<StatusExtensionProps> };
  levelSelector?: React.ComponentType<LevelSelectorSlotProps>;
  education: { content: Record<string, string> };
  visualization?: { matchTrace(trace: SolverTrace): boolean; Component: React.ComponentType<VisualizationProps> };
}
```

---

## 4. 数据 Schema v1.0（zod 定义）

> 定义于 `packages/core/src/schemas/`。
> 所有 schema 遵循 `schemaVersion` 字段约定，支持 migrator 升级。

### 4.1 关卡文件 Schema

```typescript
// packages/core/src/schemas/level.ts
import { z } from 'zod';

export const LevelSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  gameId: z.string().min(1).max(64),
  levelId: z.string().min(1).max(128),
  initialState: z.record(z.string(), z.unknown()),
  difficulty: z.object({
    score: z.number().min(0).max(100),
    factors: z.record(z.string(), z.number()),
    labelKey: z.string(),
  }),
  optimalSteps: z.number().int().nonnegative().nullable(),
  uniqueSolution: z.boolean(),
  generatedBy: z.string(),
  createdAt: z.string().datetime(),
});

export type LevelV1 = z.infer<typeof LevelSchemaV1>;

/** 版本化关卡联合类型（方便后续扩展） */
export const LevelSchema = z.discriminatedUnion('schemaVersion', [
  LevelSchemaV1,
  // LevelSchemaV2 在此追加
]);

export type Level = z.infer<typeof LevelSchema>;
```

### 4.2 游戏状态序列化 Schema

```typescript
// packages/core/src/schemas/state.ts
import { z } from 'zod';

export const GameStateSnapshotSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  gameId: z.string().min(1).max(64),
  /** 游戏特定状态数据 */
  state: z.record(z.string(), z.unknown()),
  /** 走子历史 */
  moveHistory: z.array(z.record(z.string(), z.unknown())),
  /** 当前步数 */
  stepCount: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export type GameStateSnapshotV1 = z.infer<typeof GameStateSnapshotSchemaV1>;
```

### 4.3 教学内容 Schema

```typescript
// packages/core/src/schemas/education.ts
import { z } from 'zod';

/** 五段式教学内容 */
export const EducationContentSchema = z.object({
  schemaVersion: z.literal(1),
  gameId: z.string(),
  depth: z.enum(['L2', 'L3']),
  locale: z.enum(['zh-CN', 'en']),
  sections: z.object({
    /** 阶段 1：玩（L1 无内容，仅游戏本体） */
    play: z.object({
      /** 给完全新手的 1 行提示（i18n key） */
      quickTip: z.string().optional(),
    }).optional(),
    /** 阶段 2：思考挑战（抛钩子问题） */
    think: z.object({
      hook: z.string(), // e.g. "有没有必胜策略？最少几步？"
    }),
    /** 阶段 3：揭示抽象（形式化定义+复杂度） */
    reveal: z.object({
      formalDefinition: z.string(), // LaTeX/Markdown
      complexityClass: z.string(),
      complexityJustification: z.string(),
    }),
    /** 阶段 4：求解器演示 */
    solve: z.object({
      algorithmName: z.string(),
      algorithmDescription: z.string(), // Markdown
      pseudocode: z.string().optional(), // L3 only
      complexityAnalysis: z.string(),
    }),
    /** 阶段 5：出题（生成器原理） */
    create: z.object({
      generationStrategy: z.string(), // Markdown
      difficultyFactors: z.string(),
    }).optional(), // L3 only
  }),
});

export type EducationContent = z.infer<typeof EducationContentSchema>;
```

### 4.4 Migrator 框架

```typescript
// packages/core/src/schemas/migrator.ts

export interface SchemaMigrator<T = unknown> {
  /** 源版本号 */
  from: number;
  /** 目标版本号 */
  to: number;
  /** 迁移函数 */
  migrate(data: T): T;
}

/** 迁移管道：串联应用多个 migrator，将数据从旧版本升至最新 */
export function migrateData<T>(
  data: T & { schemaVersion: number },
  currentVersion: number,
  migrators: SchemaMigrator<T>[]
): T;
```

---

## 5. 平台 × 能力支持矩阵

| 能力                  | Web (Chrome/Firefox/Safari)                        | Desktop (Tauri, 系统 WebView)                                 | Mobile (Capacitor, 原生 WebView)                                                                 |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **可玩性**      | ✅ Full — 首屏 ＜ 3s，DOM+Canvas 双轨，触控+键鼠  | ✅ Full — 复用 Web 渲染，Tauri 壳提供文件系统/通知等原生能力 | ✅ Full — 复用 Web 渲染，Capacitor 壳提供触觉/状态栏等原生能力                                  |
| **求解器**      | ✅ Full — 纯 TS 求解器，>500ms 走 Web Worker      | ✅ Full — 同 Web，可选 WASM 加速（Tauri 可加载原生二进制）   | ⚠️ Degraded — Web Worker 可用但内存受限（iOS 约 200MB/Worker），大型 SAT/DLX 可能降级为单线程 |
| **关卡生成器**  | ✅ Full — 同求解器，Worker 中运行                 | ✅ Full                                                       | ⚠️ Degraded — 同移动端 Worker 限制                                                            |
| **教学(L2/L3)** | ✅ Full — KaTeX 渲染，Markdown 展示               | ✅ Full — 同 Web                                             | ✅ Full — 同 Web，屏幕较小需响应式布局适配                                                      |
| **算法可视化**  | ✅ Full — React Flow(≤500 节点流畅) + D3         | ✅ Full — 同 Web                                             | ⚠️ Degraded — 大型搜索树(>200 节点)交互流畅度下降；建议移动端默认展示简化版                   |
| **性能**        | ✅ 基准 — V8/JSCore，JIT 优化                     | ✅ 基准+ — 系统 WebView，可选 WASM                           | ⚠️ 弱于 V8 — iOS WKWebView 无 JIT(Nitro 禁用)，JS 性能约为桌面端 1/3–1/2                     |
| **离线支持**    | ✅ PWA — Service Worker 缓存，静态资源全离线      | ✅ 天然离线 — Tauri 壳内置静态资源                           | ✅ 天然离线 — Capacitor 壳内置静态资源                                                          |
| **Worker 支持** | ✅ Dedicated Worker + Shared Worker                | ✅ Worker (WebView 支持)                                      | ✅ Worker (iOS 10+, Android 4.4+)                                                                |
| **文件 I/O**    | ⚠️ 有限 — File API (导入导出)，localStorage 5MB | ✅ Full — Tauri FS API，本地文件系统                         | ⚠️ 有限 — Capacitor Filesystem API，App 沙盒                                                  |

### 降级策略

```
求解器降级链:
  Web/Desktop: 纯 TS Worker → (可选) WASM 加速 → 回退纯 TS Worker
  Mobile:      纯 TS Worker → Worker 超内存 → 单线程 TS 主线程(提示用户关闭其他 App)

可视化降级链:
  Web/Desktop: React Flow/D3 完整版
  Mobile:      React Flow 简化版(≤200 节点) → 静态 SVG 替代

性能降级链:
  Web/Desktop: 完整求解深度
  Mobile:      限制搜索深度/节点数(弹窗"建议在桌面端体验完整求解")
```

---

## 6. Monorepo 目录骨架

> **图例**：`★` 已实现 / `○` 阶段 5+ 实现。所有标注 `★` 的文件当前均存在。

```
Ludus/
├── pnpm-workspace.yaml
├── package.json              # root: scripts, devDeps
├── tsconfig.base.json        # 共享 TS 配置
├── vitest.workspace.ts       # Vitest workspace 配置
├── .gitignore
├── CLAUDE.md
├── README.md
│
├── docs/                     # 所有文档
│   ├── PROGRESS.md
│   ├── DECISIONS.md
│   ├── lessons-learned.md
│   └── phases/
│       ├── 00-backlog.md
│       ├── 00-alignment.md
│       ├── 01-product-plan.md
│       ├── 02-architecture.md
│       ├── 03-education-framework.md
│       └── 04-ui-design-system.md
│
├── packages/
│   ├── core/
│   │   ├── package.json      # @ludus/core
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # barrel export ★
│   │       ├── types/
│   │       │   ├── plugin.ts       # GamePlugin interface + ai 字段 (§3) ★
│   │       │   ├── level.ts        # LevelConfig 类型 ★
│   │       │   └── solution.ts     # Solution, SolverTrace, SolutionStats ★
│   │       ├── schemas/
│   │       │   ├── level.ts        # LevelSchema (zod) ★
│   │       │   ├── state.ts        # GameStateSnapshotSchema ★
│   │       │   ├── education.ts    # EducationContentSchema ★
│   │       │   └── migrator.ts     # SchemaMigrator, migrateData ★
│   │       └── worker/
│   │           └── messages.ts     # Worker 消息协议 ★
│   │
│   ├── games/
│   │   ├── package.json      # @ludus/games
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # barrel + registry + getGameEntry ★
│   │       ├── types.ts      # GamePluginEntry<S,M> + BoardProps + 辅助类型 ★
│   │       ├── lights-out/
│   │       │   ├── index.ts        # lightsOutEntry: GamePluginEntry ★
│   │       │   ├── types.ts        # LightsOutState, LightsOutMove ★
│   │       │   ├── rules.ts        # legalMoves, applyMove, isSolved, initialState, getDifficulty ★
│   │       │   ├── solver.ts       # GF(2) 高斯消元 ★
│   │       │   ├── generator.ts    # 反向求解关卡生成器 ★
│   │       │   ├── render.tsx      # LightsOutBoard ★
│   │       │   └── manifest.ts     # metadata + educationManifest + visualizationManifest ★
│   │       ├── sokoban/
│   │       │   ├── index.ts        # sokobanEntry: GamePluginEntry ★
│   │       │   ├── types.ts        # SokobanState, SokobanMove ★
│   │       │   ├── rules.ts        # legalMoves, applyMove, isSolved, getDifficulty ★
│   │       │   ├── solver.ts       # BFS 求解器 ★
│   │       │   ├── solver-utils.ts # 死锁检测/状态比较工具 ★
│   │       │   ├── generator.ts    # Microban 选关生成器 ★
│   │       │   ├── levels.ts       # Microban 经典关卡集 ★
│   │       │   ├── render.tsx      # SokobanBoard ★
│   │       │   └── manifest.ts     # metadata + manifest ★
│   │       ├── sudoku/
│   │       │   ├── index.ts        # sudokuEntry: GamePluginEntry ★
│   │       │   ├── types.ts        # SudokuState, SudokuMove ★
│   │       │   ├── rules.ts        # legalMoves, applyMove, isSolved, getDifficulty ★
│   │       │   ├── solver.ts       # DLX 精确覆盖求解器 ★
│   │       │   ├── generator.ts    # dig-with-DLX 生成器 ★
│   │       │   ├── difficulty.ts   # clues-based 难度公式 ★
│   │       │   ├── render.tsx      # SudokuBoard ★
│   │       │   └── manifest.ts     # metadata + i18n keys ★
│   │       ├── nim/
│   │       │   ├── index.tsx       # nimEntry: GamePluginEntry (含 Board wrapper) ★
│   │       │   ├── types.ts        # NimState, NimMove ★
│   │       │   ├── rules.ts        # legalMoves, applyMove, isSolved, getDifficulty ★
│   │       │   ├── solver.ts       # XOR Nim-sum 求解器 ★
│   │       │   ├── generator.ts    # P-position/N-position 随机生成器 ★
│   │       │   ├── difficulty.ts   # pile-count 难度公式 ★
│   │       │   ├── render.tsx      # NimBoard ★
│   │       │   ├── manifest.ts     # metadata + manifest ★
│   │       │   ├── i18n.ts         # 游戏专属 i18n 字符串 ★
│   │       │   └── toolbar.tsx     # 先后手选择 ★
│   │       └── wythoff/
│   │           ├── index.tsx       # wythoffEntry: GamePluginEntry (含 Board wrapper) ★
│   │           ├── types.ts        # WythoffState, WythoffMove ★
│   │           ├── rules.ts        # legalMoves, applyMove, isSolved, getDifficulty ★
│   │           ├── solver.ts       # Beatty 序列求解器 ★
│   │           ├── generator.ts    # 随机生成器 ★
│   │           ├── difficulty.ts   # maxStone 难度公式 ★
│   │           ├── render.tsx      # WythoffBoard ★
│   │           ├── manifest.ts     # metadata + manifest ★
│   │           ├── i18n.ts         # 游戏专属 i18n 字符串 ★
│   │           └── toolbar.tsx     # 先后手选择 ★
│   │
│   ├── education/
│   │   ├── package.json      # @ludus/education
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts ★
│   │       └── content/
│   │           ├── lights-out/     # L2/L3 × zh-CN/en (4 个 .md) ★
│   │           ├── sokoban/        # 同上 ★
│   │           ├── sudoku/         # 同上 ★
│   │           ├── nim/            # 同上 ★
│   │           └── wythoff/        # 同上 ★
│   │
│   └── ui/
│       ├── package.json      # @ludus/ui
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts ★
│           ├── GameToolbar.tsx     # 通用工具栏（撤销/重做/重置/求解/提示/新关卡）★
│           ├── GameStatusBar.tsx   # 状态栏（步数/最优/用时/求解状态）★
│           ├── ProgressiveDisclosure.tsx  # L1/L2/L3 渐进揭示容器 ★
│           ├── MarkdownRenderer.tsx # KaTeX + Markdown 渲染 ★
│           └── ErrorBoundary.tsx   # 错误边界 ★
│
├── apps/
│   ├── web/
│   │   ├── package.json      # ludus-web
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx       # 入口：i18n init + Router ★
│   │       ├── App.tsx        # Router + entrySetup ★
│   │       ├── entrySetup.tsx  # Web 层 entry 增强（education content + viz + toolbar 注入）★
│   │       ├── i18n/          # 共享 UI i18n 资源 + init ★
│   │       ├── stores/
│   │       │   └── gameStore.ts  # Zustand store（零游戏专属引用）★
│   │       ├── components/
│   │       │   ├── GameShell.tsx       # 游戏框架（board + toolbar + statusBar + sidebar）★
│   │       │   ├── EducationPanel.tsx  # 侧边栏（五段式 + 可视化 + 步骤列表）★
│   │       │   ├── KnowledgeCard.tsx   # Bento 知识卡 ★
│   │       │   ├── SokobanToolbar.tsx  # Sokoban 关卡选择器 ★
│   │       │   └── ...                # HubPage, GamePage 等 ★
│   │       ├── statusCards.tsx    # 游戏状态卡片（按 gameId 渲染）★
│   │       └── workers/
│   │           └── solver.worker.ts  # 求解器 Web Worker 入口 ★
│   │
│   ├── desktop/              # Tauri 壳（○ 阶段 6）
│   │   └── ...
│   │
│   └── mobile/               # Capacitor 壳（○ 阶段 6）
│       └── ...
│
└── tests/                    # E2E / 集成测试（阶段 7）
    └── ...
```

---

## 7. 关键设计决策（本次新增）

### 7.1 为何 GamePlugin 中 render 不是纯 Core 层概念？

Core 定义 `GamePlugin` 接口（含 `renderBackend` 声明），但**不包含 React 组件签名**。具体渲染由 `packages/games/<game>/render.tsx` 实现，通过 `apps/web/src/components/GameShell` 加载。这保持了 Core 零 UI 依赖，同时允许每个游戏选择渲染策略。

### 7.2 求解器与生成器为何在各游戏而非 Core？

> **2026-06-27 修订（ADR-023）**：本节的原始结论已被推翻。求解器、生成器和难度度量现已全部迁入各游戏目录。理由：5 款游戏后，策略重合度不足以为"通用框架"提供依据；即使相似策略（如 GF(2)、DLX、BFS）在细节上也各有差异，强行抽象增加耦合。Core 仅保留类型定义、Schema 和 Worker 消息协议。

### 7.3 Worker 策略

- `packages/core/src/worker/` 定义 Worker task 抽象
- `apps/web/src/workers/solver.worker.ts` 是 Web Worker 入口，import 各游戏 solver
- `apps/web/src/components/GameShell.tsx` 负责检测求解耗时：< 500ms 同步执行，> 500ms 提交 Worker

---

## 📌 阶段 2 小结

- 四层架构：Core → Game Module → Education → Presentation（严格单向依赖）。
- **4 个包**：core / games / education / ui + 1 个 app (web)，pnpm workspace 管理。i18n 字符串归入各游戏目录，viz 组件在 web 层按 trace.type 懒加载。
- GamePlugin 接口 v1.0 + **GamePluginEntry**（全自包含插件入口）：覆盖 metadata/state/moves/solve/generate/difficulty/ai/BoardComponent/i18n/education/viz 全生命周期。
- 3 个 zod schema：Level、GameStateSnapshot、EducationContent，均含 `schemaVersion` 字段 + migrator 框架。
- 平台 × 能力矩阵：Web/Desktop/Mobile 各有 9 项能力标注（Full/Degraded/Unavailable），含降级策略。
- **每款游戏自包含**：types/rules/solver/generator/difficulty/render/manifest/i18n。新增游戏 = 加目录 + registry 一行，零改动已有代码。

---

*角色：系统架构师 | 产出：`docs/phases/02-architecture.md` | ✅ 已确认*
