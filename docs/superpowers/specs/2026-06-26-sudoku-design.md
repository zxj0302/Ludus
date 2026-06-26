# Sudoku Design Spec

> 状态：✅ 已确认 | 日期：2026-06-26 | 阶段：5b（增量游戏 #3）

## 1. 概述

标准 9×9 数独。Core 层实现 Dancing Links (DLX) 精确覆盖求解器 + "填满→挖空→验证唯一解"生成器，Game 层注册插件，Web 层 SudokuBoard 渲染，DLX Matrix Viz 展示矩阵操作。

## 2. 关键决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 难度方案 | 基于线索数（方案 A） | 实现量小，与现有模式一致 |
| 可视化 | 精确覆盖矩阵 custom SVG（方案 A） | 信息量最大，展示 DLX 核心机制 |
| 网格尺寸 | 仅 9×9 | 聚焦标准数独，类型简单 |
| 铅笔笔记 | MVP 不含 | 留到后续迭代 |

## 3. 类型定义

### `packages/core/src/types/sudoku.ts`

```ts
interface SudokuState extends GameState {
  n: number;           // 9，方便未来扩展到 4/6
  grid: number[];      // length 81，0 = 空，1-9 = 已填
  givenMask: boolean[]; // length 81，true = 初始给定（不可修改）
}

interface SudokuMove extends Move {
  row: number;   // 0-8
  col: number;   // 0-8
  value: number; // 1-9，0 = 擦除（仅限非给定格）
}
```

## 4. Core 层

### 4.1 `packages/core/src/solver/dlx-sudoku.ts`

**DLX 精确覆盖矩阵**（729 行 × 324 列）：

- 行 `r*81 + c*9 + v-1`：在 (r,c) 放置数字 v
- 列约束：
  - 0-80：(r,c) 有数字（cell）
  - 81-161：第 r 行有数字 v（row）
  - 162-242：第 c 列有数字 v（col）
  - 243-323：第 b 宫有数字 v（box）

**算法**：
1. 根据当前盘面（given + user填写），确定哪些行已被强制选择
2. 构建 DLX 矩阵（列节点 + 行节点的双向十字链表）
3. 递归搜索（choose column with min size → try each row → cover/uncover）
4. 支持 `countSolutions(limit=2)` 用于唯一解验证

**Trace**：记录每一步 `chooseColumn` / `cover` / `uncover` / `backtrack`，附带当前矩阵状态快照（被覆盖的列集合、已选行集合）。

**导出函数**：
- `solveSudoku(grid: number[]): SudokuSolution` — 求解，返回第一个解
- `countSudokuSolutions(grid: number[], limit: number): number` — 计数解（生成器用）
- `validateSudoku(grid: number[]): boolean` — 验证盘面是否合法（无冲突）

### 4.2 `packages/core/src/generator/sudoku-generator.ts`

三步生成：
1. **填满完整盘面**：随机填 17 个数字作为种子 → DLX 求解得到完整盘面
2. **随机挖空**：生成 1..81 的 Fisher-Yates shuffle → 逐个尝试挖空
3. **验证唯一解**：每次挖后用 `countSudokuSolutions(grid, 2) === 1` 验证，失败则恢复

```ts
function generateSudokuLevel(config: LevelConfig): Level {
  // targetClues: 根据 difficultyRange 计算（17-36）
  // 1. 生成完整盘面
  // 2. 挖空到 targetClues
  // 3. 包装成 Level 返回
}
```

### 4.3 `packages/core/src/difficulty/sudoku-difficulty.ts`

```ts
// 标准数独最少 17 线索，最易 ~36 线索
// score = (36 - clues) / 19 * 100，clamp [0, 100]
function computeSudokuDifficulty(clues: number): Difficulty
```

## 5. Game 层

### 5.1 `packages/games/src/sudoku/rules.ts`

```ts
legalMoves(state): SudokuMove[]
// 对每个空格 (r,c) 和每个 1-9，检查是否同行/列/宫无冲突
// 优化：维护 rowSets/colSets/boxSets 缓存，O(1) 检查

applyMove(state, move): SudokuState
// 如果 (r,c) 是 given，返回原 state（不可修改）
// 否则将 grid[idx] 设为 value
// 深拷贝 grid 数组（不可变更新）

isSolved(state): boolean
// 81 格全非 0 && 无冲突

getDifficulty(state): Difficulty
// 数 givenMask 中 true 的数量，调用 computeSudokuDifficulty
```

### 5.2 求解器包装

```ts
solve(state): Solution {
  const t0 = performance.now();
  const result = dlxSolveSudoku(state.grid);
  return {
    solvable: result !== null,
    moves: solutionGridToMoves(state, result), // 转换为 SudokuMove[]
    trace: result.trace,
    stats: { nodesExplored, timeMs, solutionLength, solverName: 'DLX', terminated }
  };
}
```

### 5.3 `packages/games/src/sudoku/render.tsx` — SudokuBoard

**Props**：
- `state: SudokuState`
- `onMove: (move: SudokuMove) => void`
- `disabled?: boolean`
- `highlightCell?: { row: number; col: number } | null`
- `conflictCells?: { row: number; col: number }[]`（冲突格列表）

**交互**：
- 点击空格 → 选中态（大号高亮边框），底部数字面板 1-9 弹出
- 点击已填 given 格 → 无反应（不可修改）
- 点击已填非 given 格 → 选中态，可点数字覆盖或点擦除
- 与选中格相同数字的其他格 → 弱高亮（同类高亮）
- 冲突格 → 红色背景

**渲染**：DOM + CSS Grid (9×9)，3×3 宫用 `border` 粗线分隔，Framer Motion `layout` 动画。

### 5.4 插件入口

```ts
export const sudokuPlugin: GamePlugin<SudokuState, SudokuMove> = {
  metadata: {
    id: 'sudoku',
    nameKey: 'game.sudoku.name',
    descriptionKey: 'game.sudoku.description',
    category: 'category.constraint-satisfaction',
    icon: '🧩',
    isFastSolver: true, // DLX 对标准 9×9 通常 < 5ms
    tags: ['数独', 'Sudoku', 'CSP', '精确覆盖', 'DLX', '逻辑'],
    renderBackend: 'dom',
    platformSupport: [
      { platform: 'web', capabilities: { playable: true, solver: 'full', generator: 'full', education: 'full', visualization: 'full', webWorker: false } },
      { platform: 'desktop', capabilities: { playable: true, solver: 'full', generator: 'full', education: 'full', visualization: 'full', webWorker: false } },
      { platform: 'mobile', capabilities: { playable: true, solver: 'full', generator: 'full', education: 'full', visualization: 'full', webWorker: false } }
    ],
    version: '0.1.0',
  },
  initialState,
  generateLevel,
  legalMoves,
  applyMove,
  isSolved,
  solve,
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: { ... },
  visualizationManifest: { traceType: 'constraint-propagation', componentName: 'DLXMatrixViz', library: 'custom-svg' },
};
```

### 5.5 可视化 — DLXMatrixViz

Custom SVG 懒加载组件。展示：
- 矩阵网格（列名标注：Cell00-Cell80, Row0V1-Row8V9, Col0V1-Col8V9, Box0V1-Box8V9）
- 当前 DLX 选择的行高亮（绿色）
- 被 cover 的列高亮（灰色）
- 回溯时行/列取消高亮（红色闪烁）
- 右侧搜索统计面板

## 6. Web 层集成

### 6.1 GameShell 分支

在 `GameShell.tsx` 的 `BoardComponent` 选择逻辑中增加 `sudoku` 分支，导入 `SudokuBoard`。

### 6.2 EducationPanel

在 `EducationPanel.tsx` 的 `CONTENT_MAPS` 中增加 sudoku 条目，指向 4 个教学内容文件。

### 6.3 i18n

新增 key（约 25-30 个）：
- `game.sudoku.*`：name, description, status.*, toolbar.*
- `sudoku.board.*`：数字面板、擦除按钮、冲突提示
- `sudoku.matrix.*`：矩阵可视化标签、图例
- 两个语言文件同步添加

## 7. 教学内容（四份 .md）

放在 `packages/education/src/content/sudoku/`：
- `l2.zh-CN.md` / `l2.en.md`
- `l3.zh-CN.md` / `l3.en.md`

结构：五段式（玩→思考挑战→揭示抽象→求解器演示→出题），L3 含 DLX 伪代码和精确覆盖形式化。

## 8. 测试

| 文件 | 测什么 | 预计数量 |
|------|--------|----------|
| `sudoku-rules.test.ts` | legalMoves/applyMove/isSolved 正确性 | ~15 |
| `sudoku-dlx.test.ts` | DLX 求解已知谜题、无解盘面、多解盘面、计数解 | ~10 |
| `sudoku-generator.test.ts` | 生成关卡合法、唯一解、线索数在范围内 | ~5 |
| `sudoku-difficulty.test.ts` | 难度公式正确 | ~3 |

## 9. 注册

在 `packages/games/src/registry.ts` 注册 `sudokuPlugin`，`packages/games/src/index.ts` re-export。

## 10. 文件清单

```
新增文件（~12 个）:
  packages/core/src/types/sudoku.ts
  packages/core/src/solver/dlx-sudoku.ts
  packages/core/src/generator/sudoku-generator.ts
  packages/core/src/difficulty/sudoku-difficulty.ts
  packages/games/src/sudoku/rules.ts
  packages/games/src/sudoku/index.ts
  packages/games/src/sudoku/manifest.ts
  packages/games/src/sudoku/render.tsx
  packages/games/src/sudoku/rules.test.ts
  apps/web/src/components/DLXMatrixViz.tsx
  packages/education/src/content/sudoku/l2.zh-CN.md
  packages/education/src/content/sudoku/l2.en.md
  packages/education/src/content/sudoku/l3.zh-CN.md
  packages/education/src/content/sudoku/l3.en.md

修改文件（~7 个）:
  packages/core/src/types/index.ts       — export sudoku types
  packages/core/src/solver/index.ts      — export DLX solver
  packages/core/src/generator/index.ts   — export sudoku generator
  packages/games/src/index.ts            — re-export sudoku plugin
  packages/games/src/registry.ts         — register sudokuPlugin
  apps/web/src/components/GameShell.tsx  — add SudokuBoard branch
  apps/web/src/components/EducationPanel.tsx — add sudoku content mapping
  apps/web/src/i18n/zh-CN.ts             — sudoku translation keys
  apps/web/src/i18n/en.ts                — sudoku translation keys
```
