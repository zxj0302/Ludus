# 围堵小偷（Thief Siege）— 设计文档

> 状态：已确认 | 2026-07-10  
> 实现计划：`docs/superpowers/plans/2026-07-10-thief-siege.md`  
> 游戏 id：`thief-siege`  
> 中文名：围堵小偷  
> 英文名：Thief Siege  
> 后续关联：Angel and Devil（同家族第二款，本 spec 不实现）

## 1. 概述

「围堵小偷」是 Ludus 第 9 款游戏，归属**图论 / 追逃与割点直觉**。玩家扮演警察：**只放置、不移动**；AI 扮演小偷，每回合走一步，试图逃到地图**边缘**。障碍物与警察共同挡路。

与经典会移动的 Cops and Robbers 不同：本游戏是 **Angel–Devil 风格的有限地图变体**（堵路方 vs 移动方），胜利条件改为「逃到边界 / 被困无路」。

**v1 棋盘拓扑**：方格四向邻接 + **不规则可玩区域轮廓**（非强制矩形岛屿）。六边形列为后续增强，状态层用抽象图表示以便扩展。

## 2. 游戏机制

### 2.1 规则（v1）

1. 地图由可走格、固定障碍、边缘逃生格组成（方格，上下左右邻接）。
2. 开局：小偷在内部可走格；玩家尚未放置警察（或 0 名）。
3. **轮流**：
   - **警察回合（玩家）**：在空的可走、非小偷所在格上放置 **1** 名警察（该格此后永久不可走）。
   - **小偷回合（AI）**：向四邻之一移动 1 步（不穿墙、不踩警察）。
4. **小偷胜利**：移动到任意**边缘逃生格**（或从内部一步踏入边缘）。
5. **玩家胜利**：轮到小偷时，小偷**无合法走子**（被警察 + 障碍围死）。
6. 警察**永不移动**；不可放置在障碍上、已有警察上、或当前小偷所在格。

可选约束（生成器可调）：

- 警察数量上限 `maxCops`（默认与难度挂钩，如 8–20）。
- 若达到上限仍未困住小偷且小偷仍有出路 → 继续由小偷走，直到逃出或自困（通常会逃出 → 玩家负）。

### 2.2 状态模型

```ts
type CellKind = 'floor' | 'obstacle' | 'exit'; // exit ⊆ 边缘可走格

interface ThiefSiegeState {
  width: number;
  height: number;
  /** row-major；障碍与非可玩区用 obstacle；不规则轮廓外也标为 obstacle */
  cells: CellKind[];
  thief: { row: number; col: number };
  cops: { row: number; col: number }[];
  /** 'cop' = 玩家放置回合；'thief' = AI 移动回合 */
  phase: 'cop' | 'thief';
  /** 0 = 玩家(警察), 1 = AI(小偷) — 与现有对抗游戏约定对齐 */
  currentPlayer: 0 | 1;
  maxCops: number;
  status: 'playing' | 'cop-win' | 'thief-win';
}

/** 警察回合：放置；小偷回合：移动 */
type ThiefSiegeMove =
  | { type: 'place'; row: number; col: number }
  | { type: 'step'; row: number; col: number };
```

不规则轮廓：`cells` 中轮廓外一律 `obstacle`，视觉上可不渲染或渲染为虚空，逻辑上不可走。

### 2.3 对局流程

1. `generateLevel` 产出可玩地图：小偷有至少一条到边缘的路径；开局 `phase = 'cop'`。
2. 玩家放置 → `phase = 'thief'` → AI `getAIMove` 走一步 → 若未终局则 `phase = 'cop'`。
3. 终局后禁用走子；教育面板可展示逃逸通路 / 割点分析。

### 2.4 与 plugin.ai 的关系

复用 Nim/Wythoff 对抗管线：

- `ai.isAITurn(state)` → `state.phase === 'thief' && state.status === 'playing'`
- `ai.getAIMove(state)` → 小偷一步（见 §3）
- 玩家走子仅为 `place`；`step` 仅由 AI（或求解演示）发出

## 3. 求解器与 AI

### 3.1 图模型

每个 `floor`/`exit` 且未被警察占据的格子为顶点；四向邻接且两端可走则有边。

- **逃逸可达**：从小偷位置 BFS/DFS，是否存在通往任一 `exit` 的路径。
- **合法走子**：小偷邻格中仍在图内的顶点。

### 3.2 AI 策略（v1）

优先级：

1. 若存在一步踏入 `exit` → 走该步（立即获胜）。
2. 否则在仍能保持「逃逸可达」的走法中，选 **到最近 exit 的最短路** 的下一步（BFS）。
3. 若所有走法都会失去逃逸可达 → 选度最大 / 随机合法步（拖延）。

难度可通过「偶尔随机非最优步」降级（可选，v1 可先全最优）。

### 3.3 `solve(state)` 语义

对**当前警察放置方**给出分析（教学用），而非完整博弈树穷尽（状态空间随地图增大）：

```ts
// 示意
{
  solvable: boolean,           // 若轮到警察：是否存在放置使小偷最终可被困（启发式/有限界搜索）
  moves: ThiefSiegeMove[],     // 推荐的下一步 place（切断关键通路的格）
  trace: {
    type: 'escape-path' | 'cut-vertex',  // 需在 core SolverTrace 联合类型中扩展
    visualizationData: {
      escapePath?: { row: number; col: number }[],
      cutCandidates?: { row: number; col: number }[],
    }
  },
  stats: { solverName: 'escape-bfs + cut-heuristic', ... }
}
```

**v1 求解器范围（务实）**：

- 必做：逃逸路径 BFS、推荐放置点 = 当前最短逃逸路径上的可放置格（优先靠近小偷的瓶颈）。
- 不做：完整交替博弈的完美求解（可留 L3 说明为 NP/指数级搜索）。

提示（hint）：返回一个推荐 `place`。

## 4. 生成器

### 4.1 流程

```
generateThiefSiegeLevel(config):
  1. 按 difficultyRange 选地图尺寸（如 7×7 / 9×9 / 11×11）与障碍密度
  2. 生成不规则可玩区（例如椭圆/噪声掩膜，外圈标 obstacle，边缘可走格标 exit）
  3. 随机洒障碍，保证连通
  4. 小偷放在内部；BFS 确认至少 1 条到 exit 的路径
  5. maxCops 随难度增加而减少（更难围堵）或障碍更少（小偷更好逃）
  6. 失败重试；strict 高级参数可要求最小逃逸路径长度
```

### 4.2 难度直觉

| 更难（玩家） | 手段 |
|--------------|------|
| 小偷更好逃 | 更短出口距离、更少障碍、更大 maxCops 需求 |
| 地图更绕 | 多走廊、多出口 |

难度分：综合「初始最短逃逸长度」「出口数量」「可玩格数」。

### 4.3 高级生成（可选 v1.1）

`generatorControls`：尺寸、障碍密度、`maxCops`、最小逃逸长度；挂到 `GamePluginEntry.generatorControls`。

## 5. 难度度量

```ts
getDifficulty(state):
  score ≈ f(shortestEscapeLen, exitCount, openCells, copsPlaced)
```

开局分用于 Hub/生成；对局中可更新「剩余逃逸长度」。

## 6. UI / 渲染

- **Board**：DOM + CSS Grid；不规则区外透明或深色虚空；边缘 `exit` 用高亮描边。
- **交互**：警察回合点击空地放置；非法格禁用。
- **反馈**：小偷移动用 Framer Motion；围死 / 逃出有明确胜负条。
- **toolbar**：默认 `GeneratorToolbar`；本游戏无「高级生成」也可先 `showAdvancedUnavailable`。
- **教育**：五段式 markdown（L2/L3 × zh/en）；可视化 = 逃逸路径高亮 + 可选割点候选。

## 7. 插件集成清单

| 项 | 路径 / 动作 |
|----|-------------|
| 游戏包 | `packages/games/src/thief-siege/`（types/rules/solver/generator/difficulty/render/manifest/i18n/index） |
| 注册 | `registry.ts` + `entrySetup.tsx` |
| 教学 | `packages/education/src/content/thief-siege/` × 4 |
| Trace 类型 | `packages/core` 扩展 `'escape-path'`（及可选 `'cut-vertex'`） |
| i18n | 游戏包 i18n + web 合并 |
| AI | `GamePlugin.ai` |
| 测试 | rules / solver / generator / difficulty + load-smoke |

## 8. DoD（对照 B.7）

- [ ] 可玩：放置、围死/逃出、撤销重做、新关卡  
- [ ] 求解器：逃逸 BFS + 推荐放置；测试覆盖  
- [ ] 生成器：保初始可逃逸；难度可调  
- [ ] 难度函数  
- [ ] 算法可视化：逃逸路径  
- [ ] 五段式教学中英 L2/L3  
- [ ] Core 无 UI；重计算可主线程（地图小）或 Worker  
- [ ] 模块开发者文档 `docs/games/thief-siege.md`

## 9. 非目标（v1）

- 六边形棋盘（后续）
- 警察移动 / 多名可移动警察
- 玩家操控小偷
- 完整 Angel and Devil（无限棋盘、力量 k、毁格而非放子）— **单独一款后续游戏**
- 完美信息下的完备博弈求解

## 10. 与 Angel and Devil 的衔接

| | 围堵小偷 v1 | Angel and Devil（后续） |
|--|-------------|-------------------------|
| 堵路方 | 放置警察占格 | 毁掉一格 |
| 移动方 | 小偷一步四向 | 天使力量 k 跳跃 |
| 棋盘 | 有限不规则方格 | 大/无限格 |
| 胜负 | 边缘逃出 / 无路 | 永续生存 / 困死 |

共享：占格集合、移动方合法步、困死判定；差异用独立 `rules`/`types`，可抽 `packages/games/src/pursuit-block/` 共享工具（可选，第二款时再抽）。

## 11. 开放决策（已确认）

| 项 | 结论 |
|----|------|
| 对战角色 | 玩家警察，AI 小偷 |
| 警察移动 | 否，仅放置 |
| 回合 | A：放 1 警 ↔ 小偷走 1 步 |
| 拓扑 v1 | 方格 + 不规则轮廓 |
| 中文名 | 围堵小偷 |
| id | `thief-siege` |

---

**请评审本 spec。** 确认后将编写实现计划 `docs/superpowers/plans/2026-07-10-thief-siege.md`，再按任务实现。
