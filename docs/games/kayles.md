# Kayles Developer Notes

## Identity

| 字段 | 值 |
|------|-----|
| **Game id** | `kayles` |
| **Category** | combinatorial game theory |
| **Hub** | 第 13 款 |
| **Ruleset** | Knock 1 or 2 **adjacent** standing pins |
| **Trace / viz** | `kayles-mex` → `KaylesMexViz`（各段 $\ell$、$g$、XOR） |
| **Viz library** | `dom`（实时重算） |
| **Solver** | Memoized Kayles $g(n)$ + XOR；人回合仅必胜步 |
| **Hand choice** | `phase: 'choosing'` + `prependHistory` |
| **Victory** | 无存活瓶；Nim 同构；`isPlayerVictory` ⟺ `currentPlayer===1` |
| **Toolbar** | `GeneratorToolbar` |

## Module Map

```
packages/games/src/kayles/
packages/education/src/content/kayles/
apps/web/src/components/KaylesMexViz.tsx
```

## Rules / UI

1. State: `alive: boolean[]`, `initialLength`, `phase`, `currentPlayer`.
2. Move: `{ index, count: 1 | 2 }`.
3. UI: click pin → optional adjacent for knock-2 → confirm buttons（无嵌套问题：每瓶独立 button）。
4. Hint: `{ row: 0, col: index, value: count }`.

## Sprague–Grundy

OEIS **A002186** prefix through 12:

`0,1,2,3,1,4,3,2,1,4,2,6,4`

Exports: `computeKaylesGrundy`, `chainXor`, `findKaylesWinningMove`, `chainLengths`（避免裸名 `findWinningMove`）。

**Note:** For $1\le n\le 12$, $g(n)\neq 0$ — Hub single-chain openings are always N. Generator uses **chain length** bands only (`generatedBy: chain-length`).

## Generator

| 难度带 | 链长 |
|--------|------|
| easy | 4–6 |
| medium | 7–9 |
| hard | 10–12 |

## Tests

```bash
pnpm exec vitest run packages/games/src/kayles packages/games/src/load-smoke.test.ts
```

## Spec

`docs/superpowers/specs/2026-07-15-kayles-design.md`
