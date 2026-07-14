# Peg Solitaire（孔明棋）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship English-board Peg Solitaire as a Ludus game plugin: playable graded goals, bitmask search with D4 symmetry, Worker solve, React Flow viz, and rich L2/L3 education.

**Architecture:** Self-contained `packages/games/src/peg-solitaire/` (bitmask geometry/rules/solver/generator). Deep search runs in Web Worker like fifteen. Education content is a first-class deliverable (comprehensive, rigorous, fun). Hub registration last.

**Tech Stack:** TypeScript, Vitest, `@ludus/core` Solution/Worker, React + Framer Motion + React Flow (web viz), i18n.

## Global Constraints

- 零硬编码用户可见字符串——全部走 i18n
- 游戏逻辑纯 TS（仅 `render.tsx` / `education-ui.tsx` 可依赖 React）
- id=`peg-solitaire`；英式 33 孔；`category.search`；`renderBackend: 'dom'`
- `pegs` 编码锁定为 **单个 `number` bitmask（bit 0..32）**——JS 安全整数足够，禁止改用 BigInt 除非测试证明必要
- 目标：`le3` / `one-any` / `one-center` 随 difficultyRange
- 教学侧栏：全面、严谨、有趣（spec §7）；四份 md 五段式标题
- Trace：复用 `'search-tree'`（与 Sokoban 一致），不新增 union 成员除非必要
- 不做法式盘/三角盘/唯一最短证明/3D
- 测试全绿 + `pnpm typecheck`
- Branch: create/use `feat/peg-solitaire` from current tip

## File map

| 文件 | 职责 |
|------|------|
| `packages/games/src/peg-solitaire/geometry.ts` | 孔坐标、中心索引、跳跃三元组、D4 置换表 |
| `packages/games/src/peg-solitaire/types.ts` | State / Move / Goal |
| `packages/games/src/peg-solitaire/rules.ts` | legalMoves / applyMove / isSolved / normalize status |
| `packages/games/src/peg-solitaire/rules.test.ts` | 规则与终局 |
| `packages/games/src/peg-solitaire/solver.ts` | 对称规范化 + IDA*/回溯搜索 + Solution |
| `packages/games/src/peg-solitaire/solver.test.ts` | 小残局可解、对称键稳定 |
| `packages/games/src/peg-solitaire/puzzles.ts` | 经典开局 + 精选残局常量 |
| `packages/games/src/peg-solitaire/generator.ts` | 挖空 + 验证可达 |
| `packages/games/src/peg-solitaire/difficulty.ts` | 难度分 |
| `packages/games/src/peg-solitaire/render.tsx` | DOM 十字盘 UI |
| `packages/games/src/peg-solitaire/manifest.ts` | education/viz manifests |
| `packages/games/src/peg-solitaire/i18n.ts` | 游戏文案 |
| `packages/games/src/peg-solitaire/education-ui.tsx` | StatusCard / formatMove |
| `packages/games/src/peg-solitaire/index.tsx` | plugin + entry |
| `packages/education/src/content/peg-solitaire/*.md` | L2/L3 × zh/en（重投入） |
| `apps/web/src/components/PegSearchViz.tsx` | React Flow 搜索树 |
| `apps/web/src/entrySetup.tsx` | 注册 education/viz/toolbar |
| `apps/web/src/workers/solver.worker.ts` | peg-solitaire solve |
| `packages/games/src/registry.ts` | Hub 注册 |
| `docs/games/peg-solitaire.md` | 开发者文档 |
| `docs/DECISIONS.md` | ADR 摘要 |

---

### Task 1: Geometry + types + rules

**Files:**
- Create: `geometry.ts`, `types.ts`, `rules.ts`, `rules.test.ts`

**Interfaces:**
- Produces:

```ts
export const HOLE_COUNT = 33;
export const CENTER_HOLE = /* fixed index */;
export type PegGoal = 'le3' | 'one-any' | 'one-center';
export interface PegSolitaireState {
  pegs: number; // bits 0..32
  goal: PegGoal;
  status: 'playing' | 'won' | 'stuck';
}
export type PegSolitaireMove = { from: number; over: number; to: number };

export const JUMPS: ReadonlyArray<PegSolitaireMove>; // precomputed
export function popcount(pegs: number): number;
export function hasPeg(pegs: number, hole: number): boolean;
export function createClassicState(goal: PegGoal): PegSolitaireState; // center empty
export function legalMoves(state: PegSolitaireState): PegSolitaireMove[];
export function applyMove(state: PegSolitaireState, move: PegSolitaireMove): PegSolitaireState;
export function isSolved(state: PegSolitaireState): boolean;
export function meetsGoal(pegs: number, goal: PegGoal): boolean;
export function isOwnState(state: unknown): state is PegSolitaireState;
```

**Geometry note:** Use standard English board occupancy on a 7×7 grid with corners missing (33 cells). Document hole index diagram in `geometry.ts` comment. `CENTER_HOLE` = center of cross.

- [ ] **Step 1: Failing tests** — classic start has 32 pegs; one legal jump from a known position; applyMove clears from/over; goal `one-center` wins only with center; no moves → `stuck` if not won

- [ ] **Step 2: Implement geometry + rules**

- [ ] **Step 3: Run**

```bash
pnpm --filter @ludus/games exec vitest run src/peg-solitaire/rules.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(peg-solitaire): add English board geometry and rules"
```

---

### Task 2: Solver with D4 symmetry

**Files:**
- Create: `solver.ts`, `solver.test.ts`
- Modify: `geometry.ts` if symmetry tables live there

**Interfaces:**

```ts
export function canonicalKey(pegs: number): number; // min bitmask among D4 images
export function solvePegSolitaire(
  state: PegSolitaireState,
  options?: { timeMs?: number; findShortest?: boolean },
): Solution;
```

- Search: BFS/IDA* for shortest when `findShortest` or small popcount; otherwise DFS with visited canonical keys
- Trace: `type: 'search-tree'`, visualizationData includes nodes explored + optional path
- `stats.solverName`: e.g. `peg-ida-star+D4` or `peg-dfs+D4`
- Must solve a **tiny handcrafted** 3–4 move puzzle in tests; classic full board may be slow — test classic only with generous timeout OR test that search starts without throw; prefer curated micro-puzzle for shortest-path assert

- [ ] **Step 1: Failing tests** — canonicalKey invariant under rotation; micro-puzzle returns solvable moves; meetsGoal after applying solution

- [ ] **Step 2: Implement symmetry + search**

- [ ] **Step 3: Run solver tests**

```bash
pnpm --filter @ludus/games exec vitest run src/peg-solitaire/solver.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(peg-solitaire): add D4-symmetric search solver"
```

---

### Task 3: Puzzles, generator, difficulty

**Files:**
- Create: `puzzles.ts`, `generator.ts`, `difficulty.ts`, `generator.test.ts`, `difficulty.test.ts`

**Interfaces:**

```ts
export function generatePegSolitaireLevel(config: LevelConfig): Level;
export function getDifficulty(state: PegSolitaireState): Difficulty;
export function goalFromDifficultyRange(range: [number, number]): PegGoal;
```

- Classic + ≥3 curated puzzles (with comments: intended goal, optional known length)
- Generator: start from classic or full; remove random pegs; verify `solvePegSolitaire` finds any solution for target goal within budget; retry
- Easy/mid/hard map to goals per spec

- [ ] **Step 1–4: TDD + commit**

```bash
git commit -m "feat(peg-solitaire): add puzzles, generator, and difficulty"
```

---

### Task 4: Plugin UI + registry + Worker

**Files:**
- Create: `render.tsx`, `manifest.ts`, `i18n.ts`, `education-ui.tsx`, `index.tsx`
- Modify: `registry.ts`, `packages/games/src/index.ts`, `apps/web/src/workers/solver.worker.ts`, `apps/web/src/entrySetup.tsx` (partial: entry map only if education ready — or register plugin now and attach empty education then fill Task 5)
- Prefer: register fully in Task 5 together with education; **this task** delivers playable plugin + registry + worker + board UI with placeholder education content `{}`

**UI:** Cross-shaped DOM board; select peg → highlight targets; Framer Motion light hop optional.

**Metadata:** `webWorker: true`, `isFastSolver: false`, icon e.g. `♟️` or `◉`, nameKeys `game.pegSolitaire.*`

- [ ] **Step: Implement + load-smoke sees peg-solitaire**

```bash
pnpm --filter @ludus/games exec vitest run src/load-smoke.test.ts src/peg-solitaire/
pnpm typecheck
```

- [ ] **Commit**

```bash
git commit -m "feat(peg-solitaire): register playable plugin with Worker solve"
```

---

### Task 5: Education (heavy) + PegSearchViz + docs

**Files:**
- Create: 4× `packages/education/src/content/peg-solitaire/*.md`
- Create: `apps/web/src/components/PegSearchViz.tsx`
- Modify: `entrySetup.tsx` — raw md + viz + GeneratorToolbar
- Create: `docs/games/peg-solitaire.md`
- Modify: `docs/DECISIONS.md` (next ADR), `docs/PROGRESS.md`

**Education quality bar (blocking for this task):**
- L2/L3 each language: ≥3 explicit “hooks” and ≥3 checkable rigorous claims
- Five headings exact; KaTeX where useful
- L3 covers bitmask, D4, search, complexity honesty, implementation pointers

**Viz:** matchTrace `search-tree` for peg-solitaire entry only (or filter by gameId in component); show solution path / explored count

- [ ] **Step: Full verify**

```bash
pnpm test:run
pnpm typecheck
```

- [ ] **Commit**

```bash
git commit -m "feat(peg-solitaire): add education, search viz, and docs"
```

---

## Spec coverage

| Spec | Task |
|------|------|
| §4 rules / bitmask | Task 1 |
| §6 solver + D4 + Worker | Task 2 + 4 |
| §5 goals / puzzles / generator | Task 3 |
| §7 education quality | Task 5 |
| §8 DoD / Hub | Task 4–5 |
| §9 non-goals | skipped |

## Encoding lock

**`pegs: number` with bits 0..32.** Document in `types.ts`. Tests pin classic start popcount === 32 and center bit clear.
