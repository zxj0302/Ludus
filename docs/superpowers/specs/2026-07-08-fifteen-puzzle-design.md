# 15-Puzzle — A* 搜索游戏设计文档

> 状态：已确认 | 2026-07-08

## 1. 概述

15-Puzzle（数字华容道）是 Ludus 第 6 款游戏，归属**搜索算法**领域。4×4 网格滑动数字块，A* 算法求解（曼哈顿距离启发式），自定义 SVG 搜索树可视化。

## 2. 游戏机制

### 2.1 规则

- 4×4 网格，数字 1-15 加一个空位（0）
- 点击空位相邻的数字块，该块滑入空位
- 键盘方向键移动空位
- 目标：排列成 `[1,2,3,4, 5,6,7,8, 9,10,11,12, 13,14,15,0]`

### 2.2 状态模型

```ts
interface FifteenState extends GameState {
  grid: number[]  // 16 个元素，行优先，0 = 空位
}

interface FifteenMove extends Move {
  tileIndex: number  // 被滑动的数字块索引
}
```

### 2.3 生成策略

从已解状态做 N 次随机合法滑动（避免立即撤销上一步）。
- easy: N ∈ [10, 20]
- medium: N ∈ [20, 40]
- hard: N ∈ [40, 80]

## 3. A* 求解器

- 启发式：曼哈顿距离（可采纳、一致）
- 优先队列：Min-heap（f = g + h）
- 去重：grid 序列化为字符串
- Worker 分流：store 检测走 Worker

## 4. 难度度量

`score = min(100, (scrambleDepth / 80) * 100)`
factors: `{ scrambleDepth }`

## 5. 渲染

CSS Grid 4×4，数字块用 motion.button，Framer Motion layout 动画。
空位显示为半透明占位。点击/键盘/触屏滑动均支持。

## 6. 文件清单

```
packages/games/src/fifteen/
  types.ts, rules.ts, solver.ts, generator.ts, difficulty.ts,
  render.tsx, manifest.ts, i18n.ts, index.tsx

apps/web/src/components/FifteenTreeViz.tsx

packages/education/src/content/fifteen/
  l2.zh-CN.md, l2.en.md, l3.zh-CN.md, l3.en.md
```
