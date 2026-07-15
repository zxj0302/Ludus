# Kayles — 设计 Spec

> 状态：**Hub 已上线**（`kayles`，第 13 款）  
> 日期：2026-07-15  
> 关联 backlog：`docs/phases/00-backlog.md` §2 组合博弈 — Kayles  
> 开发者笔记：`docs/games/kayles.md`  
> 前置：Nim / Grundy's Game 已上线（SG + mex/XOR 样板）

## 1. 定位

**Kayles（保龄 / 撞柱）**：一排瓶子；每回合打掉 **1 个**或 **相邻 2 个**；中间断开后形成若干独立子局。**最后走子者胜**（normal play）。

与已上线博弈的差异点：

| 游戏 | 核心洞察 |
|------|----------|
| Nim | XOR of pile **sizes** |
| Grundy's Game | 拆堆 → 每堆映射 nimber（A002188） |
| **Kayles** | 打瓶断链 → 连续段映射 nimber（**A002186** / octal `.77`） |

教学主线：同一套 Sprague–Grundy，但「走子几何」不同——断链产生的**和游戏**比拆堆更直观。

| 层 | 体验 |
|----|------|
| **L1** | 一排瓶 + 点选打 1/2，零公式 |
| **L2** | 一句话：每段连续瓶有隐藏 Nim 堆；XOR=0 必败 |
| **L3** | mex 递推、OEIS A002186、octal 简述、整局最优、生成器 |

## 2. 已确认决策

| 项 | 结论 |
|----|------|
| **id** | `kayles` |
| **开局** | **单链**（用户选 A）：一排 `n` 瓶全部存活 |
| **规模** | Hub **`n ≤ 12`**（默认演示约 8–10）；生成器按难度采 `n` |
| **规则** | 打掉 1 个存活瓶，或 2 个**相邻且均存活**的瓶 |
| **终局** | 无存活瓶 → 无合法走子 → 当前玩家负 |
| **胜负实现** | Nim 同构：`isPlayerVictory` ⟺ 终局且 `currentPlayer === 1` |
| **先后手** | `phase: 'choosing'`（与 Nim / Grundy 相同） |
| **AI** | XOR≠0 则必胜步；否则随机合法步 |
| **求解器** | 记忆化 `g(n)`（单链）；局面 = 各连续段 XOR；人回合 P → 空 `moves`（Hint → `noWinningMove`） |
| **生成器** | 按难度采单链长度（easy 4–6 / mid 7–9 / hard 10–12）；`generatedBy: chain-length`；种子可复现。**注**：Hub $n\le 12$ 单链开局恒为 N（A002186），不以开局 P 偏向 |
| **渲染** | DOM 一排瓶；**点选 + 确认按钮**（点一瓶 → 可选邻瓶预览打 2 → 「打掉 1 / 打掉 2」确认 / 取消；再点已选瓶 = 清空） |
| **可视化** | `trace.type === 'kayles-mex'`；`KaylesMexViz`：各段长度、`g(ℓ)`、XOR、推荐打法 |
| **非目标** | Misère、Dawson's Kayles（只打 2）、多链开局模式、n>12、在线对战 |

## 3. 规则精确定义

**状态**：

- `alive: boolean[]` — 长度 = 开局 `n`，`true` = 仍在；打掉后变 `false`（空位保留，便于 UI 索引稳定）
- `currentPlayer: 0 | 1`
- `phase: 'choosing' | 'playing'`
- `initialLength: number`（= 开局 `n`，供难度/重置）

**合法走子**：`{ index: number; count: 1 | 2 }`

- `count === 1`：`alive[index] === true`
- `count === 2`：`alive[index] && alive[index + 1]`（相邻下标）

应用：将对应位置置 `false`；始终切换 `currentPlayer`。

**连续段**：`alive` 中极大连续 `true` 游程，长度序列 `ℓ₁, ℓ₂, …`。

**终局**：`alive` 全为 `false`（无段）。

**P/N**：局面为 P ⟺ `g(ℓ₁) ⊕ g(ℓ₂) ⊕ … = 0`。

### 3.1 单链 Grundy 数（Kayles）

打掉位置 `k`（0-based，链长 `n`）的 1 瓶 → 左右链 `k` 与 `n−1−k`。  
打掉 `k,k+1` → 左右 `k` 与 `n−2−k`。

$$
g(0)=0,\quad
g(n)=\operatorname{mex}\Biggl(
  \bigl\{ g(i)\oplus g(n-1-i) \mid 0\le i < n \bigr\}
  \cup
  \bigl\{ g(i)\oplus g(n-2-i) \mid 0\le i \le n-2 \bigr\}
\Biggr).
$$

（第一类：打 1 瓶；第二类：打相邻 2 瓶。空链约定 \(g(0)=0\)。）

前若干项（OEIS [A002186](https://oeis.org/A002186)，与 Wikipedia Kayles 表一致）：

```
n:  0 1 2 3 4 5 6 7 8 9 10 11 12
g:  0 1 2 3 1 4 3 2 1 4  2  6  4
```

单元测试必须对照上表；Hub 仅需 `n ≤ 12`。

## 4. UI / 交互

1. **选先后手**：同 Nim（推荐高亮依 `playerStarts`）。
2. **点选 + 确认按钮**：
   - 点存活瓶 A → 选中；
   - 再点与 A 相邻的存活瓶 B → 预览「打掉这两瓶」，显示「打掉这 2 个」；
   - 「打掉 1 个」→ `count: 1`（仅选中 A）；
   - 「打掉这 2 个」→ `count: 2`（仅预览成立时）；
   - 再点已选中的 A → 清空选中；「取消」同理。
3. 已打掉位置淡化，保持一排几何与稳定下标。
4. Hint：`highlightCell = { row: 0, col: index, value: count }`（写入 `moveToHighlight`）。

## 5. 求解 / 可视化

- `computeKaylesGrundy(n)` / `chainLengths(alive)` / `chainXor(alive)` / `findKaylesWinningMove(alive)`
- `solveKayles`：分析步 + 整局序列；`visualizationData.playerStarts`
- 人回合且 XOR=0 → `moves=[]`（对齐 Grundy/Nim Hint）
- Viz：`KaylesMexViz` — 实时按当前 `alive` 重算各段 `g` 与 XOR（勿用开局 trace 叠当前状态）

导出注意：包 barrel 使用 `findKaylesWinningMove` / `computeKaylesGrundy` / `chainXor` 等前缀，避免与 Nim/Grundy 的 `findWinningMove` 撞名。

## 6. 模块结构

```
packages/games/src/kayles/
  types.ts, rules.ts, solver.ts, generator.ts, difficulty.ts
  render.tsx, education-ui.tsx, i18n.ts, manifest.ts, index.tsx
  *.test.ts
packages/education/src/content/kayles/   # L2/L3 × zh-CN/en
apps/web/src/components/KaylesMexViz.tsx
docs/games/kayles.md
```

Core：`SolverTrace['type']` 增加 `'kayles-mex'`。

## 7. 实施顺序

1. **Task 1** — types + rules（alive / legalMoves / applyMove / chooseHand / isPlayerVictory）+ rules.test.ts  
2. **Task 2** — solver（`g(n)` + XOR + findWinningMove + 整局；对照 A002186）+ solver.test.ts  
3. **Task 3** — generator + difficulty + tests  
4. **Task 4** — plugin / render（点选确认）/ i18n / registry / entrySetup / AI / KaylesMexViz  
5. **Task 5** — education L2/L3 × zh/en + `docs/games/kayles.md` + README/backlog/PROGRESS  

## 8. 参考

- [Wikipedia: Kayles](https://en.wikipedia.org/wiki/Kayles) / OEIS [A002186](https://oeis.org/A002186)
- *Winning Ways*；octal game `.77`
- 本仓库 `grundys-game`（SG 插件 / Hint-P / viz 实时重算样板）、`nim`（选先后手）

## 9. 确认与交付

用户已确认：单链开局、`n ≤ 12`、点选确认 UI、`alive: boolean[]`、Nim 同构胜负。

| Task | 状态 |
|------|------|
| 1 types + rules | ✅ |
| 2 solver + A002186 | ✅ |
| 3 generator + difficulty | ✅ |
| 4 plugin / Hub / viz / AI | ✅ |
| 5 education + docs + README | ✅ |

Hub 第 13 款已上线（本地）；待用户授权后 commit/push。

**实现备注**：Hub $n\le 12$ 单链开局恒为 N（A002186），生成器用链长分档（`generatedBy: chain-length`），不以开局 P 偏向。
