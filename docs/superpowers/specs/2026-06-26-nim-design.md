# Nim — 博弈论游戏设计文档

> 状态：待评审 | 2026-06-26

## 1. 概述

Nim 是 Ludus 第 4 款 MVP 游戏，归属**组合博弈论**领域。实现标准 Nim 取石子游戏的人机对战模式，使用 Bouton XOR 定理作求解器，P 位置距离作难度度量，React Flow 作博弈树可视化。

## 2. 游戏机制

### 2.1 规则

- k 堆石子，每堆初始 ni 颗
- 双方轮流从**某一堆**取走任意正数颗（≥1，≤ 整堆剩余数）
- 取走最后一颗者胜（正常玩法 Normal Play）
- 不支持 Misère 玩法（反规则）

### 2.2 状态模型

```ts
interface NimState {
  piles: number[]          // 每堆剩余石子数
  currentPlayer: 0 | 1    // 0 = 玩家, 1 = AI
  initialPiles: number[]   // 初始局面（重置用）
}

interface NimMove {
  pileIndex: number        // 取哪堆
  removeCount: number      // 取几颗
}
```

### 2.3 对局流程

1. 生成初始局面（N 位置，nim-sum ≠ 0，保证玩家有机会赢）
2. **玩家选择先手/后手**（在能看到布局、对局开始前选）
3. 若玩家选后手 → AI 先走一步
4. 玩家走 → 判定胜利
5. 若未胜 → AI 自动走（最优策略，走 XOR 使局面回到 P 位置）
6. 循环直到一方取走最后一颗

### 2.4 胜利判定

玩家取走最后一颗 → 玩家胜。AI 取走最后一颗 → AI 胜。

## 3. 求解器

### 3.1 核心定理（Bouton, 1901）

```
nimSum = piles[0] ^ piles[1] ^ ... ^ piles[k-1]

P 位置（Previous player win）：nimSum = 0（上一手的人必胜）
N 位置（Next player win）：     nimSum ≠ 0（下一手的人有必胜走法）
```

### 3.2 必胜走法

当 nimSum ≠ 0 时，找堆 i 使 `piles[i] ^ nimSum < piles[i]`，从该堆取走 `piles[i] - (piles[i] ^ nimSum)` 颗。

### 3.3 接口

```ts
solveNim(state: NimState): Solution {
  solvable: true
  isNPosition: boolean
  winningMove?: NimMove     // N 位置的必胜走法
  pValue: 0 | 1             // P=0, N=1
  trace: { type: 'nim-xor', steps: [...] }
  stats: { solverName: 'Nim-sum (Bouton)', timeMs, nodesExplored: 1 }
}
```

常数时间（O(k)），无需回溯搜索。

## 4. 生成器

### 4.1 难度度量：P 位置距离

从目标局面出发，到达 P 位置所需的最小合法移动步数。

- d = 1：简单。只有 1 种走法通向必胜，玩家一步就能进入 P 位置（安全区）
- d = 2：中等。需连续 2 步正确
- d ≥ 3：困难。多步正确走法链

### 4.2 对抗性 AI 修正

以 P 距离作难度需考虑 AI 的对抗：仅当玩家每一步都选最优走法时，剩余步数才等于 P 距离。实际难度 = P 距离 + AI 反击强度。

### 4.3 生成流程

```
generateNimLevel(config: LevelConfig): Level
  1. difficultyRange → 目标 P 距离 d（1-5）
  2. 随机生成 P 位置（nim-sum = 0 的局面）
  3. 从 P 位置随机走 d 步（每次从合法 N 位置走法中随机选）到达 N 位置
  4. 返回 initialState（piles + initialPiles）
```

### 4.4 难度公式

```
score = ((d - 1) / 4) * 100    // d∈[1,5] → score∈[0,100]
d=1 → score=0 (easy)
d=5 → score=100 (hard)
```

## 5. 渲染

### 5.1 NimBoard

- 每堆用一排石子 token 展示（可点击圆形）
- 点击某堆 = 选中（高亮），再点一次取消
- 选中某堆后，点击"取 1/2/3/全部"按钮确定取子数
- AI 走子有短暂动画（石子逐个消失，0.3s）
- 顶部状态栏显示"轮到谁" + P/N 位置标识

### 5.2 先手/后手选择 UI

新游戏开始时，展示堆布局 + "你先走 / AI 先走"两个按钮，玩家看到布局后选。

## 6. 博弈树可视化（NimTreeViz）

### 6.1 技术选型

React Flow（已在依赖中，懒加载），自动布局（dagre），可拖拽缩放。

### 6.2 展示内容

- 根节点 = 当前状态，标注 nim-sum 和 P/N
- 子节点 = 所有合法走法可达状态（递归展开 2-4 层）
- 节点颜色：蓝色 N 位置 / 红色 P 位置
- 边标注走法（"堆 1 取 2"）
- 必胜路径边高亮加粗

### 6.3 接口

```ts
traceType: 'nim-xor'
componentName: 'NimTreeViz'
library: 'react-flow'
```

## 7. 教学内容

五段式 × (L2/L3) × (zh-CN/en) = 4 份 markdown。

| 段 | L2（泛人群） | L3（专业） |
|---|---|---|
| 1. 玩 | 规则动画 | 同 L2 |
| 2. 思考 | "为什么有的局面无论怎么走都会输？" | XOR 反直觉性 + Nim-sum 猜想引导 |
| 3. 揭示 | Nim-sum = XOR，P/N 位置 | Bouton 定理 + Sprague-Grundy 定理简介 |
| 4. 求解 | XOR 演算逐步展示 | 定理证明 + 归纳法 |
| 5. 出题 | P 距离难度概念 | 生成器原理 + 对抗性 AI |

## 8. 技术架构

### 8.1 文件清单

| 层 | 文件 | 职责 |
|---|---|---|
| Core | `packages/core/src/types/nim.ts` | NimState, NimMove 类型 |
| Core | `packages/core/src/solver/nim-solver.ts` | Bouton XOR 求解器 |
| Core | `packages/core/src/generator/nim-generator.ts` | P 距离驱动生成 |
| Core | `packages/core/src/difficulty/nim-difficulty.ts` | P 距离 → score |
| Game | `packages/games/src/nim/rules.ts` | 规则引擎 + legalMoves/applyMove/isSolved |
| Game | `packages/games/src/nim/render.tsx` | NimBoard |
| Game | `packages/games/src/nim/manifest.ts` | 教育/可视化清单 |
| Game | `packages/games/src/nim/index.ts` | 插件入口 |
| Web | `apps/web/src/components/NimTreeViz.tsx` | React Flow 博弈树 |
| Edu | `packages/education/src/content/nim/l2.*.md` | L2 中英 |
| Edu | `packages/education/src/content/nim/l3.*.md` | L3 中英 |

### 8.2 集成点

- `packages/games/src/registry.ts` — 注册 nimPlugin
- `apps/web/src/components/GameShell.tsx` — NimBoard 分支 + moveToCell
- `apps/web/src/components/EducationPanel.tsx` — Nim 状态卡片 + NimTreeViz
- `apps/web/src/i18n/zh-CN.ts / en.ts` — Nim i18n keys
- `packages/core/src/types/index.ts / solver/index.ts / generator/index.ts` — re-export

### 8.3 非目标

- 不支持 Misère Nim
- 不包含 Wythoff 游戏
- 不支持多玩家（始终人机对战）
- 不做在线 PvP

## 9. 测试范围

| 模块 | 测试点 | 预计数量 |
|---|---|---|
| nim-solver | XOR 计算、P/N 判定、必胜走法正确性 | 8 |
| nim-generator | 合法局面、P 距离准确、难度范围 | 5 |
| nim-difficulty | score 映射、边界值 | 3 |
| rules | legalMoves 完整性、applyMove 不可变性、isSolved | 8 |
| 总计 | | ~24 |

## 10. 与其他游戏的一致性检查

- [ ] 零硬编码字符串，全部走 t()
- [ ] metadata.isFastSolver = true（O(k) XOR 常数时间）
- [ ] renderBackend: 'dom'
- [ ] 插件实现完整 GamePlugin 接口
- [ ] Core 层框架无关纯 TS
- [ ] 教学 markdown 五段式结构
- [ ] 可视化 trace 类型与 manifest 一致
