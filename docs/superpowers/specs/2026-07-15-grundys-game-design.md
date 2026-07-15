# Grundy's Game — 设计 Spec

> 状态：**Hub 已上线**（`grundys-game`，第 12 款）  
> 日期：2026-07-15  
> 关联 backlog：`docs/phases/00-backlog.md` §2 组合博弈 — Grundy's Game ★ cut-the-knot  
> 开发者笔记：`docs/games/grundys-game.md`  
> 前置：Nim / Wythoff / Euclid's Game 已上线

## 1. 定位

**Grundy's Game**：选一堆石子，拆成**两堆不等**的正整数；当所有堆大小 ≤ 2 时无合法走子，**最后走子者胜**（normal play）。

与已上线博弈的差异点：

| 游戏 | 核心洞察 |
|------|----------|
| Nim | Bouton：Nim-sum = XOR of pile sizes |
| Wythoff | Beatty / φ |
| Euclid | 减法倍数 + φ 败者态 |
| **Grundy** | **Sprague–Grundy**：每堆映射为 **nimber**（≠ 堆大小），再 XOR |

教学主线：让玩家看见「看起来不像 Nim，但**等价于**某个 Nim 局面」。

| 层 | 体验 |
|----|------|
| **L1** | 多堆石子 + 拆堆交互，零公式 |
| **L2** | 一句话：每堆有一个「隐藏的 Nim 堆」；XOR=0 必败 |
| **L3** | mex 定义、递推表、OEIS A002188、整局最优序列、生成器 |

## 2. 已确认决策

| 项 | 结论 |
|----|------|
| **id** | `grundys-game` |
| **开局** | **多堆**（用户已选方案 1）：1–4 堆，每堆约 3–12（生成器按难度调节） |
| **规则** | 选一堆 `n≥3`，拆成 `i` 与 `n−i`，要求 `1≤i<n−i`（即 `i < n/2`） |
| **终局** | 所有堆 ≤ 2 → 无合法走子 → 当前玩家负（上一位胜） |
| **胜负实现** | 与 Nim 对齐：终局后 `currentPlayer` 为**轮到但无棋可走**的一方；`isPlayerVictory` = 终局且 `currentPlayer === 1`（人类刚走完） |
| **先后手** | `phase: 'choosing'`（与 Nim / Euclid 相同） |
| **AI** | 若 XOR(nimbers)≠0 则走必胜拆分；否则随机合法拆分 |
| **求解器** | 预计算/记忆化 `g(n)`；局面 nim-sum；整局交替模拟；`playerStarts` 写入 trace |
| **生成器** | 采样多堆；简单偏 N（XOR≠0）、困难偏 P（XOR=0）；种子可复现 |
| **渲染** | DOM 多堆 `StonePile`；选堆后展示合法拆分按钮（或滑块） |
| **可视化** | `trace.type === 'grundy-mex'`；侧边栏展示每堆 `g(n)`、XOR、mex 一步说明 |
| **非目标** | Misère、单堆-only 开局模式、在线对战、证明周期性猜想 |

## 3. 规则精确定义

**状态**：`piles: number[]`（各堆大小，≥1；允许出现多个 ≤2 的堆）、`currentPlayer`、`phase`、`initialPiles`。

**合法走子**：对索引 `pileIndex` 与正整数 `left`：

- 设 `n = piles[pileIndex]`，要求 `n ≥ 3`；
- `1 ≤ left ≤ ⌊(n−1)/2⌋`（保证 `left ≠ n−left` 且两堆均为正）；
- 新局面：去掉原堆，加入 `left` 与 `n−left`（顺序无关；实现可排序或保持插入顺序，**判定只用多重集合**）。

**终局**：`∀ pile, pile ≤ 2`。

**P/N**：局面为 P ⟺ `g(p₁) ⊕ g(p₂) ⊕ … ⊕ g(pₖ) = 0`，其中 `g` 为单堆 Grundy 数。

### 3.1 单堆 Grundy 数

$$
g(0)=g(1)=g(2)=0,\quad
g(n)=\operatorname{mex}\{\, g(a)\oplus g(b) \mid a+b=n,\; a>0,\; b>0,\; a\neq b \,\}.
$$

前若干项（OEIS [A002188](https://oeis.org/A002188)，与 cut-the-knot / Wikipedia 一致）：

```
n:  0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
g:  0 0 0 1 0 2 1 0 2 1  0  2  1  3  2  1  3  2  4  3  0
```

实现：记忆化递推，Hub 关卡限制 `n ≤ 24`（或 30）即可；单元测试对照上表。

## 4. UI / 交互（推荐）

对齐 Nim 石子 UI，拆分用**两步**：

1. 点击一堆（`n≥3`）→ 高亮该堆；
2. 展示合法拆分按钮：`n → (left, n−left)`；
3. 确认后落子。

备选（非 v1）：在石子间隙点击拆分点（cut-the-knot 风格）— 实现成本更高，列为后续 polish。

选先后手、胜负文案、提示高亮：复用 Nim / Euclid 模式。

## 5. 求解 / 可视化

- `computeGrundy(n)` / `nimSum(piles)` / `findWinningMove(piles)`  
- `solveGrundysGame`：整局序列 + `visualizationData: { playerStarts, nimbers, xor, piles }`  
- Viz 组件建议名：`GrundyMexViz`  
  - L2：各堆 `n → g(n)` 与 XOR  
  - L3：可展示「对某个 n，mex 排除了哪些值」（短表，不必 React Flow 大树）

## 6. 模块结构

```
packages/games/src/grundys-game/
  types.ts, rules.ts, solver.ts, generator.ts, difficulty.ts
  render.tsx, education-ui.tsx, manifest.ts, i18n.ts, index.tsx
  *.test.ts
packages/education/src/content/grundys-game/   # L2/L3 × zh-CN/en
apps/web/src/components/GrundyMexViz.tsx
```

Core：`SolverTrace['type']` 增加 `'grundy-mex'`。

## 7. 实施顺序

1. **Task 1** — types + rules + rules.test.ts  
2. **Task 2** — solver（`g(n)` 表 + XOR + findWinningMove + 整局序列）+ solver.test.ts  
3. **Task 3** — generator + difficulty + tests  
4. **Task 4** — plugin / render / i18n / registry / entrySetup / AI  
5. **Task 5** — education L2/L3 × zh/en + `GrundyMexViz` + `docs/games/grundys-game.md` + README/backlog  

## 8. 参考

- [Cut-the-knot: Grundy's Game](https://www.cut-the-knot.org/Curriculum/Games/Grundy.shtml)
- [Wikipedia: Grundy's game](https://en.wikipedia.org/wiki/Grundy's_game) / OEIS A002188
- *Winning Ways*；Flammenkamp 的 Grundy 值表（大 n 非本模块目标）
- 本仓库 `nim`（XOR UI/选手先）、`euclids-game`（插件模式样板）

## 9. 确认与交付

用户已确认：`grundys-game`、多堆开局、拆分按钮 UI、Nim 同构终局、堆大小上限 ~24。

| Task | 状态 |
|------|------|
| 1 types + rules | ✅ |
| 2 solver + A002188 | ✅ |
| 3 generator + difficulty | ✅ |
| 4 plugin / Hub / viz / AI | ✅ |
| 5 education + docs + README | ✅ |

Hub 第 12 款已上线（本地）；待用户授权后 commit/push。
