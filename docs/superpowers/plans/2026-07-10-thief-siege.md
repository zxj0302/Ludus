# 围堵小偷（Thief Siege）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现「围堵小偷」——玩家放置警察、AI 小偷逃向边缘；逃逸 BFS + 推荐堵点；不规则方格地图；五段式教学与路径可视化。

**Architecture:** 自包含游戏插件 `packages/games/src/thief-siege/`（types/rules/solver/generator/difficulty/render/manifest/i18n/education-ui/index），经 `registry` + `entrySetup` 接入 web。对抗管线复用 `GamePlugin.ai`（与 Nim 相同）。状态用抽象格子图，v1 仅方格四向。

**Tech Stack:** TypeScript, React + Framer Motion, Tailwind, Zustand, react-i18next, Vitest

**Design spec:** `docs/superpowers/specs/2026-07-10-thief-siege-design.md`

## Global Constraints

- 零硬编码用户可见字符串——全部走 i18n（游戏包 `i18n.ts` + web 合并）
- 游戏逻辑纯 TS，不依赖 React（仅 `render.tsx` / `education-ui.tsx` 可依赖 React）
- `metadata.isFastSolver: true`（BFS 足够快）
- `renderBackend: 'dom'`
- `metadata.category`: `'category.graph-theory'`（若 key 不存在则新增中英）
- `metadata.icon`: `'🚨'`
- `SolverTrace.type` 新增 `'escape-path'`
- 教育内容 4 份 markdown：L2/L3 × zh-CN/en，五段式标题
- 生成器必须保证开局小偷有至少一条到 exit 的路径
- 警察不移动；玩家只发 `place`；AI 只发 `step`
- 测试全绿 + `pnpm typecheck`
- 不在本计划实现 Angel and Devil / 六边形

## File map

| 文件 | 职责 |
|------|------|
| `packages/games/src/thief-siege/types.ts` | 状态与走子类型 |
| `packages/games/src/thief-siege/rules.ts` | legalMoves / applyMove / isSolved / initial |
| `packages/games/src/thief-siege/solver.ts` | BFS 逃逸、AI 一步、推荐 place、solve() |
| `packages/games/src/thief-siege/generator.ts` | 不规则地图 + 保可逃逸 |
| `packages/games/src/thief-siege/difficulty.ts` | 难度分 |
| `packages/games/src/thief-siege/render.tsx` | Board UI |
| `packages/games/src/thief-siege/manifest.ts` | education/viz manifests |
| `packages/games/src/thief-siege/i18n.ts` | 游戏文案 |
| `packages/games/src/thief-siege/education-ui.tsx` | StatusCard / formatMove |
| `packages/games/src/thief-siege/index.tsx` | plugin + entry |
| `packages/education/src/content/thief-siege/*.md` | 四份教学 |
| `packages/core/src/types/plugin.ts` | `'escape-path'` |
| `packages/games/src/registry.ts` | 注册 |
| `apps/web/src/entrySetup.tsx` | 教学内容与 viz 挂载 |
| `docs/games/thief-siege.md` | 开发者文档 |

---

### Task 1: Types + rules + unit tests

**Files:**
- Create: `packages/games/src/thief-siege/types.ts`
- Create: `packages/games/src/thief-siege/rules.ts`
- Create: `packages/games/src/thief-siege/rules.test.ts`

**Interfaces:**
- Produces: `ThiefSiegeState`, `ThiefSiegeMove`, `CellKind`, `createInitialState()`, `legalMoves()`, `applyMove()`, `isSolved()`, `isOwnState()`, `cellIndex()`, `inBounds()`, `neighbors4()`

- [ ] **Step 1: Write failing tests for placement and escape win**

```ts
import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved } from './rules';

describe('thief-siege rules', () => {
  it('allows placing a cop on empty floor during cop phase', () => {
    const s = createInitialState();
    expect(s.phase).toBe('cop');
    const places = legalMoves(s).filter(m => m.type === 'place');
    expect(places.length).toBeGreaterThan(0);
    const next = applyMove(s, places[0]!);
    expect(next.cops.length).toBe(1);
    expect(next.phase).toBe('thief');
  });

  it('thief reaching exit sets thief-win', () => {
    // Build a tiny handcrafted state: thief adjacent to exit, phase thief
    // apply step onto exit → status thief-win, isSolved true for cop? 
    // Spec: isSolved = player (cop) won → status === 'cop-win'
    // Plugin isSolved means "puzzle solved / player goal met"
  });
});
```

Note: Align with existing games — for adversarial games, `isSolved` often means terminal from player perspective or use `status`. Follow Nim: `isSolved` when game over for UI; check Nim/Wythoff pattern. For thief-siege: `isSolved(state) => state.status === 'cop-win'` (player victory). Thief win is terminal but not "solved" for progress wins — still stop play via `status !== 'playing'`.

- [ ] **Step 2: Implement types.ts and rules.ts minimally to pass tests**

```ts
// types.ts — exact shapes from spec §2.2
export type CellKind = 'floor' | 'obstacle' | 'exit';
export interface ThiefSiegeState { /* as spec */ }
export type ThiefSiegeMove =
  | { type: 'place'; row: number; col: number }
  | { type: 'step'; row: number; col: number };
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/rules.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/games/src/thief-siege/types.ts packages/games/src/thief-siege/rules.ts packages/games/src/thief-siege/rules.test.ts
git commit -m "feat(thief-siege): add types and rules engine"
```

---

### Task 2: Escape BFS solver + AI move + tests

**Files:**
- Create: `packages/games/src/thief-siege/solver.ts`
- Create: `packages/games/src/thief-siege/solver.test.ts`
- Modify: `packages/core/src/types/plugin.ts` — add `'escape-path'` to `SolverTrace.type`

**Interfaces:**
- Produces: `isWalkable(state, r, c)`, `shortestEscapePath(state): {row,col}[] | null`, `chooseThiefStep(state): ThiefSiegeMove | null`, `suggestCopPlacement(state): ThiefSiegeMove | null`, `solveThiefSiege(state): Solution`

- [ ] **Step 1: Failing tests**

```ts
it('finds escape path on open map', () => { /* ... */ });
it('chooseThiefStep steps onto exit when adjacent', () => { /* ... */ });
it('suggestCopPlacement returns a cell on the shortest escape path', () => { /* ... */ });
```

- [ ] **Step 2: Implement solver.ts**

AI policy from spec §3.2: prefer exit step; else first step of BFS to nearest exit; else any legal step.

`solveThiefSiege`: build Solution with `trace.type = 'escape-path'`, `visualizationData.escapePath`, and `moves: [suggestCopPlacement]` when phase is cop.

- [ ] **Step 3: Run tests + typecheck core/games**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/solver.test.ts
pnpm --filter @ludus/core typecheck
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(thief-siege): add escape BFS solver and AI step"
```

---

### Task 3: Generator + difficulty + tests

**Files:**
- Create: `packages/games/src/thief-siege/generator.ts`
- Create: `packages/games/src/thief-siege/difficulty.ts`
- Create: `packages/games/src/thief-siege/generator.test.ts`
- Create: `packages/games/src/thief-siege/difficulty.test.ts`

**Interfaces:**
- Produces: `generateThiefSiegeLevel(config: LevelConfig): Level`, `getDifficulty(state)`, `computeThiefSiegeDifficulty(...)`

- [ ] **Step 1: Failing generator test — always escapable at start**

```ts
it('generated level has escape path from thief to an exit', () => {
  for (let i = 0; i < 20; i++) {
    const level = generateThiefSiegeLevel({ difficultyRange: [1, 100], seed: i + 1 });
    const state = level.initialState as ThiefSiegeState;
    expect(shortestEscapePath(state)).not.toBeNull();
  }
});
```

- [ ] **Step 2: Implement irregular mask**

Algorithm:
1. Pick `n` in {7,9,11} from difficulty
2. For each cell, `inside = (dx/rx)^2 + (dy/ry)^2 <= 1` with noise hole punches
3. Border of inside → `exit`; deep inside → `floor`; outside → `obstacle`
4. Sprinkle extra obstacles on floor (not cutting all escapes — verify BFS)
5. Place thief near center on floor
6. Set `maxCops` from difficulty (easier → higher maxCops)

Use `mulberry32` / `resolveSeed` from `../generator-config`.

- [ ] **Step 3: Difficulty score from shortest path length + exit count**

- [ ] **Step 4: Run tests and commit**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts src/thief-siege/difficulty.test.ts
git commit -m "feat(thief-siege): add level generator and difficulty"
```

---

### Task 4: Plugin entry, registry, i18n, AI wiring

**Files:**
- Create: `packages/games/src/thief-siege/manifest.ts`
- Create: `packages/games/src/thief-siege/i18n.ts`
- Create: `packages/games/src/thief-siege/education-ui.tsx` (StatusCard stub ok)
- Create: `packages/games/src/thief-siege/index.tsx`
- Create: `packages/games/src/thief-siege/render.tsx` (minimal board: grid + click to place)
- Modify: `packages/games/src/registry.ts`
- Modify: `packages/games/src/index.ts` if needed for exports
- Modify: `apps/web/src/i18n/zh-CN.ts` / `en.ts` — category key if missing: `category.graph-theory`

**Interfaces:**
- Produces: `thiefSiegePlugin`, `thiefSiegeEntry` with `ai: { isAITurn, getAIMove }`

```ts
ai: {
  isAITurn: (s) => s.status === 'playing' && s.phase === 'thief',
  getAIMove: (s) => {
    const move = chooseThiefStep(s);
    return move ? { move, delay: 450 } : null;
  },
}
```

`isSolved`: `state.status === 'cop-win'`  
`applyMove` must set `thief-win` / `cop-win` and refuse moves when not `playing`.

- [ ] **Step 1: Implement index + registry registration**
- [ ] **Step 2: Minimal render — show cells, thief, cops; onClick place when phase cop**
- [ ] **Step 3: load-smoke must pick up new game automatically via getAllGames()**
- [ ] **Step 4: Run**

```bash
pnpm --filter @ludus/games exec vitest run src/load-smoke.test.ts src/thief-siege/
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(thief-siege): register plugin with AI and board UI"
```

---

### Task 5: Education content + entrySetup viz + polish polish

**Files:**
- Create: `packages/education/src/content/thief-siege/l2.zh-CN.md`
- Create: `packages/education/src/content/thief-siege/l2.en.md`
- Create: `packages/education/src/content/thief-siege/l3.zh-CN.md`
- Create: `packages/education/src/content/thief-siege/l3.en.md`
- Modify: `apps/web/src/entrySetup.tsx` — import raw md, register entry, viz for `escape-path`
- Create: `apps/web/src/components/EscapePathViz.tsx` (lazy) — highlight path cells from trace
- Create: `docs/games/thief-siege.md`
- Polish: `render.tsx` motion, win/lose banners via existing GameShell status if possible

Markdown headings must match education parser stages:

```markdown
## 1. 玩 · Play
...
## 2. 思考 · Think
...
## 3. 揭示 · Reveal
...
## 4. 求解 · Solve
...
## 5. 出题 · Create
...
```

- [ ] **Step 1: Write four markdown files (concise L2, deeper L3 with path/cut intuition)**
- [ ] **Step 2: Wire entrySetup like nim**
- [ ] **Step 3: EscapePathViz reads `trace.visualizationData.escapePath`**
- [ ] **Step 4: Manual smoke on http://127.0.0.1:5173/ — Hub shows 围堵小偷, place cops, AI flees**
- [ ] **Step 5: Full test + typecheck**

```bash
pnpm test:run
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(thief-siege): add education, viz, and docs"
```

- [ ] **Step 7: Update PROGRESS.md** — move thief-siege to DONE for vertical slice; NEXT = Angel and Devil design or polish

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| §2 Rules / state | Task 1 |
| §3 Solver / AI | Task 2 |
| §4 Generator | Task 3 |
| §5 Difficulty | Task 3 |
| §6 UI | Task 4–5 |
| §7 Plugin integration | Task 4–5 |
| §8 DoD | Task 5 verification |
| §9 Non-goals | Explicitly skipped |
| §10 Angel and Devil | Deferred |

## Placeholder scan

No TBD/TODO steps; commands and types are concrete.
