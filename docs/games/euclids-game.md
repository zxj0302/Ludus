# Euclid's Game Developer Notes

## Identity

| 字段 | 值 |
|------|-----|
| **Game id** | `euclids-game` |
| **Category** | combinatorial game theory |
| **Hub** | 第 11 款（已注册；`thief-siege` 仍不在 Hub） |
| **Ruleset** | **减法倍数版**（非取模一步版） |
| **Trace / viz** | `euclid-phi` → `EuclidPhiViz`（φ 阈值、P/N、推荐 $k$） |
| **Viz library** | `custom-svg`（静态卡片，非 React Flow） |
| **Solver** | O(1) φ 判定；整局交替模拟写入 `solution.moves` |
| **Hand choice** | `phase: 'choosing'` → `chooseHand` + `prependHistory`（同 Nim） |
| **Victory** | 大堆变 0；**胜方不换手**（`currentPlayer` 保持） |
| **Toolbar** | `GeneratorToolbar` + Hub 难度选择器 |

## Module Map

```
packages/games/src/euclids-game/
  types.ts / rules.ts / solver.ts / generator.ts / difficulty.ts
  render.tsx / education-ui.tsx / i18n.ts / manifest.ts / index.tsx
  rules.test.ts / solver.test.ts / generator.test.ts
packages/education/src/content/euclids-game/   # l2/l3 × zh-CN/en
apps/web/src/components/EuclidPhiViz.tsx
apps/web/src/entrySetup.tsx                   # EDUCATION_CONTENT + viz + toolbar
```

## Rules / Victory (pitfalls)

1. 规范化始终 `[larger, smaller]`。
2. 终局：`piles[0] === 0`（或 `isTerminalPiles`）；**不要**按 Nim 那样在终局切换 `currentPlayer`。
3. `isPlayerVictory` = `isSolved && currentPlayer === 0`（人类刚落子清空大堆）。
4. `legalMoves` 仅暴露人类回合；AI 走 `legalMovesForPlayer` / `getAIMove`。

## P-Position (canonical)

对规范化 $(a,b)$，$a > b > 0$：

$$\text{P} \iff \lfloor b\varphi \rfloor \ge a \;\wedge\; a < b\varphi$$

- $a=b$ → **N**（一步取光）。
- 互证：`isPPosition` vs `isPPositionBrute`（`a,b ≤ 12`）在 `solver.test.ts`。

## Solver / AI / Hand hints

```typescript
// choose-hand recommendation (choosing phase)
playerStarts = !isPPosition(piles)  // N → human first; P → AI first

// full solution (Nim-style)
solveEuclidsGame → moves = full alternating sequence
visualizationData.playerStarts  // required by getPlayerStarts()
```

- AI：`findWinningMove(piles) ?? random legal multiple`。
- 缺 `playerStarts` 时 Hub 默认「人类先手」——**必须**由求解器写入。

## Generator

| 难度带 | 偏向 | `generatedBy` | i18n key |
|--------|------|---------------|----------|
| mid ≤ 66 | N | `n-position-bias` | `generator.method.nPositionBias` |
| mid > 66 | P | `p-position-bias` | `generator.method.pPositionBias` |

- 种子：`resolveSeed` + Mulberry32；默认演示局面 `[34, 21]`。
- 难度分：堆大小 + P 惩罚 + 先后手修正（`difficulty.ts`）。

## Tests

```bash
pnpm --filter @ludus/games exec vitest run src/euclids-game/ src/load-smoke.test.ts
```

覆盖：rules、φ vs brute、整局 `playerStarts`、生成可复现与 P 偏向、Hub 注册冒烟。

## Spec / Education

- Spec：`docs/superpowers/specs/2026-07-15-euclids-game-design.md`
- Education：`packages/education/src/content/euclids-game/`

## Cross-links

| 模块 | 关系 |
|------|------|
| **Nim** | 两堆/多堆不偏博弈；XOR vs φ |
| **Wythoff** | 同用 φ，但是 Beatty 序列 |
| **water-jug** | gcd / 裴蜀 — 教学交叉引用 |
