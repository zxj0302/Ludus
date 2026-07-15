# Grundy's Game Developer Notes

## Identity

| 字段 | 值 |
|------|-----|
| **Game id** | `grundys-game` |
| **Category** | combinatorial game theory |
| **Hub** | 第 12 款 |
| **Ruleset** | Split one heap into two **unequal** positive heaps |
| **Trace / viz** | `grundy-mex` → `GrundyMexViz`（每堆 $g(n)$、XOR、推荐拆分） |
| **Viz library** | `dom`（`GrundyMexViz` 实时重算；非 SVG） |
| **Solver** | Memoized mex `g(n)` + XOR；人回合仅必胜步（P → 空序列 / noWinningMove） |
| **Hand choice** | `phase: 'choosing'` + `prependHistory`（同 Nim） |
| **Victory** | 全堆 ≤2；**Nim 同构**（无棋方负；`isPlayerVictory` ⟺ `currentPlayer===1`） |
| **Toolbar** | `GeneratorToolbar` + Hub 难度选择器 |

## Module Map

```
packages/games/src/grundys-game/
  types.ts / rules.ts / solver.ts / generator.ts / difficulty.ts
  render.tsx / education-ui.tsx / i18n.ts / manifest.ts / index.tsx
  *.test.ts
packages/education/src/content/grundys-game/
apps/web/src/components/GrundyMexViz.tsx
```

## Rules / UI

1. Move: `{ pileIndex, left, right }` with `right = n - left`, `1 ≤ left ≤ ⌊(n−1)/2⌋`.
2. Apply: splice pile → insert `left`, `right`; always toggle `currentPlayer`.
3. UI: select heap (≥3) via pile **div** (`role=button`) → split buttons（避免嵌套 `<button>`）。
4. Hint highlight: `{ row: pileIndex, col/value: left }`.

## Sprague–Grundy

$$g(n)=\operatorname{mex}\{g(a)\oplus g(b)\mid a+b=n,\,a\neq b\}$$

- P ⟺ XOR of nimbers is 0 (terminal also P for the player to move).
- Export `findGrundysWinningMove`（避免与 Nim/Euclid 的 `findWinningMove` 撞名）；勿再导出裸名 `findWinningMove` / `isPPosition`。
- **Hint / Solve**：人回合 P 局面 `moves=[]` → Hub `game.status.noWinningMove`；AI 回合允许 fallback。
- Tests: OEIS A002188 for $n=0..20$ in `solver.test.ts`.

## Solver / AI

```typescript
playerStarts = computeGrundyXor(piles) !== 0  // choosing
findWinningMove(piles) ?? random legalMovesForPlayer(..., 1)  // AI only
visualizationData.playerStarts  // required
```

## Generator

| 难度带 | 堆数 / 上限 | 偏向 | `generatedBy` |
|--------|-------------|------|---------------|
| mid ≤ 33 | 2 / ≤8 | N | `n-position-bias` |
| mid ≤ 66 | 2–3 / ≤14 | N | `n-position-bias` |
| mid > 66 | 3–4 / ≤24 | P | `p-position-bias` |

至少一堆 ≥3（生成下限即为 3）。

## Tests

```bash
pnpm --filter @ludus/games exec vitest run src/grundys-game/ src/load-smoke.test.ts
```

## Spec / Education

- Spec：`docs/superpowers/specs/2026-07-15-grundys-game-design.md`
- Education：`packages/education/src/content/grundys-game/`

## Cross-links

| 模块 | 关系 |
|------|------|
| **Nim** | Bouton XOR；胜负/选手先模式样板 |
| **Euclid / Wythoff** | 同属组合博弈；判定对象不同 |
| cut-the-knot / OEIS A002188 | 权威 $g(n)$ 表 |
