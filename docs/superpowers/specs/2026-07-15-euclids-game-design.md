# Euclid's Game 欧几里得博弈 — 设计 Spec

> 状态：**Hub 已上线**（`euclids-game`，第 11 款）  
> 日期：2026-07-15（审计修复同日）  
> 关联 backlog：`docs/phases/00-backlog.md` §2 组合博弈 — Euclid's Game ★ cut-the-knot / GamesCrafters  
> 开发者笔记：`docs/games/euclids-game.md`

## 1. 定位

两堆石子减法博弈：每步从大堆减去小堆的正整数倍（不得为负）。与 **Nim / Wythoff** 同属组合博弈论入门，但核心洞察是 **欧几里得算法 / 黄金比例 φ**，而非 XOR 或 Beatty 序列。

| 层 | 体验 |
|----|------|
| **L1** | 双堆石子 + 选倍数按钮，零公式 |
| **L2** | 一句话 φ 判定 + 走一步例子 |
| **L3** | 形式化 P/N、减法版 vs 取模版、整局最优序列、生成器与文献 |

## 2. 已确认决策（实现口径）

| 项 | 结论 |
|----|------|
| **id** | `euclids-game` |
| **规则变体** | 经典 **减法倍数版**（非取模一步版）：大堆 `a`、小堆 `b`，选 `k≥1` 使 `a−kb≥0` |
| **状态** | 规范化 `[larger, smaller]`；`smaller>0` 时可玩；大堆变为 `0` 即终局 |
| **胜负** | 清空大堆的一方胜；**胜方不换手**（`currentPlayer` 保持，便于 `isPlayerVictory`） |
| **先后手** | `phase: 'choosing'` → 选人类 / AI 先手（与 Nim 相同） |
| **AI** | `findWinningMove`（φ 闭式）优先；否则随机合法 `k` |
| **求解器** | O(1) P/N + 整局交替模拟；`visualizationData.playerStarts` 驱动选手先提示 |
| **生成器** | 按难度范围采样 `(a,b)`；简单偏 N、困难偏 P；`generatedBy`：`n-position-bias` / `p-position-bias` |
| **渲染** | DOM 双堆 `StonePile` + 倍数按钮 |
| **可视化** | `trace.type === 'euclid-phi'` + `EuclidPhiViz`（φ 阈值卡片；博弈树为后续可选） |
| **非目标** | 三维变体、Misère、在线对战、取模一步版规则 |

## 3. 规则精确定义

初始：两堆正整数 `(a,b)`，`a≥b≥1`（生成器保证 `a>b`）。

轮到玩家时，令 `a≥b>0`：

- 合法 `k`：`1 ≤ k ≤ ⌊a/b⌋`（允许 `a−kb=0` 立即取胜）。
- 落子后：若 `a−kb=0` → 终局；否则 `normalize(max(a−kb,b), min(a−kb,b))`。

**败者态（实现口径）**：对 $a > b > 0$，

$$\text{P} \iff \lfloor b\cdot\varphi\rfloor \ge a \;\wedge\; a < b\cdot\varphi,\quad \varphi=\frac{1+\sqrt{5}}{2}.$$

$a=b>0$ 时先手取 $k=1$ 立即胜 → **N 位置**。与记忆化 minimax 在 `a,b≤12` 互证。

> 注意：部分文献写 $\lfloor b\varphi\rfloor < a < b\varphi$；本仓库以 **代码 + 暴力测试** 为准（含等号边界）。

## 4. 模块结构

```
packages/games/src/euclids-game/
  types.ts, rules.ts, solver.ts, generator.ts, difficulty.ts
  render.tsx, education-ui.tsx, manifest.ts, i18n.ts, index.tsx
  *.test.ts
packages/education/src/content/euclids-game/   # L2/L3 × zh-CN/en
apps/web/src/components/EuclidPhiViz.tsx
```

## 5. 实施清单

1. Task 1 — types + rules ✅
2. Task 2 — solver（φ + `findWinningMove` + 整局序列）✅
3. Task 3 — generator + difficulty ✅
4. Task 4 — plugin / render / registry / entrySetup / AI ✅
5. Task 5 — education + `EuclidPhiViz` + 开发者文档 ✅
6. 审查修复 — `playerStarts`、generatedBy i18n、文档勘误 ✅

## 6. 参考

- [Cut-the-knot: Euclid's Game](https://www.cut-the-knot.org/ctg/Euclid.html)
- GamesCrafters Euclid 求解器
- 本仓库 `water-jug`（gcd / 裴蜀）、`nim` / `wythoff`（同属两堆不偏博弈）
