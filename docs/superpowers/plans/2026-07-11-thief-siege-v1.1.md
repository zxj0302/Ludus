# 围堵小偷 v1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge thief-siege maps by difficulty (11/15/19), guarantee cop-winnable openings via hybrid verification, and replace greedy BFS thief AI with adversarial search (Worker + degradation).

**Architecture:** Keep pure-TS search in `packages/games/src/thief-siege/` (testable without DOM). Generator calls the same engine for easy-tier proofs and mid/hard shallow checks. Web `scheduleAI` gains an async path so thief-siege can await Worker results; BFS remains the final fallback. Education/docs updated last.

**Tech Stack:** TypeScript, Vitest, existing `@ludus/core` WorkerRequest/Response, Vite `?worker`, React i18n.

## Global Constraints

- 零硬编码用户可见字符串——全部走 i18n
- 游戏逻辑纯 TS，不依赖 React（仅 `render.tsx` / `education-ui.tsx` 可依赖 React）
- 允许尺寸集合 **`{11, 15, 19}`**（替换 `{7, 9, 11}`）
- 易：严格 `copHasWinningStrategy`；中/难：构造 + 浅层抽检（文案诚实）
- AI 降级链：深搜 → 有界 minimax → BFS 贪心；档位可观测
- 警察不移动；玩家 `place`；AI `step`
- 不实现六边形 / Angel and Devil / 警察移动
- 测试全绿 + `pnpm typecheck`
- Branch: continue on `feat/thief-siege` (or create `feat/thief-siege-v1.1` from current tip if preferred)

## File map

| 文件 | 职责 |
|------|------|
| `packages/games/src/thief-siege/adversary.ts` | 交替博弈搜索、评估、预算、档位结果 |
| `packages/games/src/thief-siege/adversary.test.ts` | 小盘必胜/必败与选步回归 |
| `packages/games/src/thief-siege/generator.ts` | 尺寸 11/15/19 + 混合可解保证 |
| `packages/games/src/thief-siege/generator.test.ts` | 尺寸档 + 易关必胜抽检 |
| `packages/games/src/thief-siege/solver.ts` | `chooseThiefStep` / `solveThiefSiege` 改走 adversary + BFS 回退 |
| `packages/games/src/thief-siege/index.tsx` | AI 接线；`webWorker: true` |
| `packages/core/src/worker/messages.ts` | 扩展 task type / AI payload（若需要） |
| `packages/core/src/types/plugin.ts` | 可选：`getAIMoveAsync` |
| `apps/web/src/workers/solver.worker.ts` | 注册 thief-siege solve / ai-move |
| `apps/web/src/stores/gameStoreSolverRuntime.ts` | async AI + 尊重 delay / thinking |
| `packages/games/src/thief-siege/i18n.ts` + web i18n | 「思考中」、保证口径 |
| `packages/education/src/content/thief-siege/*.md` | L2/L3 更新 |
| `docs/games/thief-siege.md` / `docs/DECISIONS.md` / `docs/PROGRESS.md` | 文档 |

---

### Task 1: Map sizes 11 / 15 / 19

**Files:**
- Modify: `packages/games/src/thief-siege/generator.ts`
- Modify: `packages/games/src/thief-siege/generator.test.ts`

**Interfaces:**
- Consumes: existing `generateThiefSiegeLevel`, `normalizeSize`, `chooseSize`
- Produces: `ALLOWED_SIZES = [11, 15, 19]`; `chooseSize(score)` → 11 / 15 / 19

- [ ] **Step 1: Update failing size tests**

```ts
it('maps difficulty tiers to 11 / 15 / 19', () => {
  const easy = generateThiefSiegeLevel({ difficultyRange: [1, 33], seed: 1 });
  const mid = generateThiefSiegeLevel({ difficultyRange: [34, 66], seed: 1 });
  const hard = generateThiefSiegeLevel({ difficultyRange: [67, 100], seed: 1 });
  expect((easy.initialState as ThiefSiegeState).width).toBe(11);
  expect((mid.initialState as ThiefSiegeState).width).toBe(15);
  expect((hard.initialState as ThiefSiegeState).width).toBe(19);
});

it('clamps config.size into {11,15,19}', () => {
  for (const raw of [7, 9, 12, 20]) {
    const level = generateThiefSiegeLevel({ difficultyRange: [1, 100], seed: 2, size: raw });
    expect([11, 15, 19]).toContain((level.initialState as ThiefSiegeState).width);
  }
});
```

- [ ] **Step 2: Run tests — expect FAIL on old 7/9/11**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts
```

- [ ] **Step 3: Implement size mapping**

```ts
const ALLOWED_SIZES = [11, 15, 19] as const;

function chooseSize(score: number): number {
  if (score <= 33) return 11;
  if (score <= 66) return 15;
  return 19;
}

function normalizeSize(raw: number): number {
  if (raw === 11 || raw === 15 || raw === 19) return raw;
  return ALLOWED_SIZES.reduce((best, candidate) =>
    Math.abs(candidate - raw) < Math.abs(best - raw) ? candidate : best,
  );
}
```

Keep escape-path acceptance and fallback size **11** (not 7). Adjust obstacle rates / `maxCops` bands if needed so open-cell targets stay in spec ranges (~40–70 / 80–140 / 150–250) — soft assert in tests optional.

- [ ] **Step 4: Re-run generator tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/games/src/thief-siege/generator.ts packages/games/src/thief-siege/generator.test.ts
git commit -m "feat(thief-siege): scale boards to 11/15/19 by difficulty"
```

---

### Task 2: Adversarial search core (pure TS)

**Files:**
- Create: `packages/games/src/thief-siege/adversary.ts`
- Create: `packages/games/src/thief-siege/adversary.test.ts`

**Interfaces:**
- Consumes: `legalMoves`, `applyMove`, `normalizeTerminalState`, `shortestEscapePath`, `isWalkable` from rules/solver
- Produces:

```ts
export type AdversaryTier = 'perfect' | 'bounded' | 'bfs';

export interface AdversaryBudget {
  /** wall-clock ms soft limit */
  timeMs: number;
  /** max ply (half-moves); Infinity for perfect attempt */
  maxDepth: number;
  /** max place candidates to expand per cop node */
  maxPlaceBranch?: number;
}

export interface AdversaryMoveResult {
  move: ThiefSiegeMove | null;
  tier: AdversaryTier;
  score: number;
  nodesExplored: number;
  timeMs: number;
  /** true if search proved cop win from this state (cop to move or after normalize) */
  copWinning?: boolean;
}

/** Thief to move: maximize escape. Cop to move: maximize trap. */
export function searchAdversary(
  state: ThiefSiegeState,
  budget: AdversaryBudget,
): AdversaryMoveResult;

export function copHasWinningStrategy(
  state: ThiefSiegeState,
  budget: AdversaryBudget,
): boolean;

export function evaluateState(state: ThiefSiegeState): number;
// Higher = better for thief (escape). Negate for cop perspective.
```

- [ ] **Step 1: Write failing tests on tiny handcrafted boards**

```ts
it('thief steps onto exit when it is a forced win in one ply', () => {
  // 3x3 corridor: thief adjacent to exit, phase thief, no cops
  const move = searchAdversary(state, { timeMs: 200, maxDepth: 4 }).move;
  expect(move).toEqual({ type: 'step', row: exitRow, col: exitCol });
});

it('copHasWinningStrategy is true when thief is one place from being trapped', () => {
  // Handcraft: one place seals all exits / surrounds thief
  expect(copHasWinningStrategy(state, { timeMs: 500, maxDepth: 8 })).toBe(true);
});

it('copHasWinningStrategy is false when thief can reach exit before any place helps', () => {
  expect(copHasWinningStrategy(openEscapeState, { timeMs: 200, maxDepth: 4 })).toBe(false);
});
```

- [ ] **Step 2: Run — FAIL (module missing)**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/adversary.test.ts
```

- [ ] **Step 3: Implement minimax / negamax with alpha-beta**

Sketch:

```ts
export function evaluateState(state: ThiefSiegeState): number {
  const normalized = normalizeTerminalState(state);
  if (normalized.status === 'thief-win') return 10_000;
  if (normalized.status === 'cop-win') return -10_000;
  const path = shortestEscapePath(normalized);
  if (!path) return -5_000;
  const exitsReachable = /* count exits reachable via BFS */;
  const copsLeft = Math.max(0, normalized.maxCops - normalized.cops.length);
  return 1000 / path.length + exitsReachable * 50 - copsLeft * 10;
}

export function searchAdversary(state: ThiefSiegeState, budget: AdversaryBudget): AdversaryMoveResult {
  const t0 = performance.now();
  // If time/depth exhausted mid-search → return best partial with tier 'bounded'
  // If never started deep search → caller may fall back to BFS
  // Root: if phase thief, pick step maximizing value; if cop, pick place minimizing thief value
}
```

Place-move ordering: prefer cells on `shortestEscapePath` (exclude thief cell). Cap branch with `maxPlaceBranch` (e.g. 8–16).

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(thief-siege): add adversarial search engine"
```

---

### Task 3: Generator hybrid win guarantee

**Files:**
- Modify: `packages/games/src/thief-siege/generator.ts`
- Modify: `packages/games/src/thief-siege/generator.test.ts`
- Optionally create: `packages/games/src/thief-siege/construct.ts` if mask helpers get large

**Interfaces:**
- Consumes: `copHasWinningStrategy`, `searchAdversary`, `shortestEscapePath`
- Produces: levels that pass tier-specific gates

- [ ] **Step 1: Failing tests**

```ts
it('easy levels pass copHasWinningStrategy under generous budget', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const level = generateThiefSiegeLevel({ difficultyRange: [10, 20], seed });
    const state = level.initialState as ThiefSiegeState;
    expect(state.width).toBe(11);
    expect(shortestEscapePath(state)).not.toBeNull();
    expect(copHasWinningStrategy(state, { timeMs: 2000, maxDepth: Infinity })).toBe(true);
  }
});

it('mid/hard openings are not immediate thief wins and keep escape path', () => {
  for (const range of [[40, 50], [80, 90]] as const) {
    const level = generateThiefSiegeLevel({ difficultyRange: [...range], seed: 3 });
    const state = level.initialState as ThiefSiegeState;
    expect(shortestEscapePath(state)).not.toBeNull();
    // Thief cannot step onto exit on first turn from opening (phase is cop first)
    expect(state.phase).toBe('cop');
  }
});
```

- [ ] **Step 2: Implement gates in `createCandidate` / `generateThiefSiegeLevel`**

```ts
function passesWinGate(state: ThiefSiegeState, targetScore: number): boolean {
  if (shortestEscapePath(state) == null) return false;
  if (targetScore <= 33) {
    return copHasWinningStrategy(state, { timeMs: 1500, maxDepth: Infinity, maxPlaceBranch: 12 });
  }
  // mid/hard: constructive checks
  const path = shortestEscapePath(state)!;
  const placeableOnPath = path.filter(p => /* not thief, walkable place target */).length;
  if (state.maxCops < Math.min(placeableOnPath, 3)) return false;
  // shallow: after best cop place (or null), thief should not be able to force exit within depth 2
  return shallowCopNotLosing(state, { timeMs: 200, maxDepth: 4, maxPlaceBranch: 8 });
}
```

Bias `buildIrregularCells` for mid/hard toward fewer exits / more bottlenecks (higher obstacle rate near rim, punch fewer border exits). Fallback template: small sealed arena size 11 with known winning `maxCops`.

- [ ] **Step 3: Run generator + adversary tests**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts src/thief-siege/adversary.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(thief-siege): hybrid cop-win generation gates"
```

---

### Task 4: Wire AI + Worker + async scheduleAI

**Files:**
- Modify: `packages/games/src/thief-siege/solver.ts` — `chooseThiefStep` / `solveThiefSiege` use adversary then BFS
- Modify: `packages/games/src/thief-siege/index.tsx` — metadata `webWorker: true` for web platform; AI still sync fallback
- Modify: `packages/core/src/types/plugin.ts` — add optional async AI
- Modify: `packages/core/src/worker/messages.ts` — add `'ai-move'` task type (or solve subtype)
- Modify: `apps/web/src/workers/solver.worker.ts` — handle `thief-siege`
- Modify: `apps/web/src/stores/gameStoreSolverRuntime.ts` — async AI path
- Modify: `packages/games/src/thief-siege/i18n.ts` (+ web keys if needed) — thinking / tier labels
- Modify: `packages/games/src/thief-siege/solver.test.ts` — still pass with BFS-compatible cases

**Interfaces:**

```ts
// plugin.ts
ai?: {
  isAITurn(state: S): boolean;
  getAIMove(state: S): { move: M; delay: number } | null;
  /** Optional async path; scheduleAI prefers this when present */
  getAIMoveAsync?(state: S): Promise<{ move: M; delay: number; tier?: string } | null>;
};

// messages.ts
export type WorkerTaskType = 'solve' | 'generate' | 'ai-move';
export interface AiMoveTaskPayload {
  gameId: string;
  state: Record<string, unknown>;
  budget?: { timeMs: number; maxDepth: number };
}
```

- [ ] **Step 1: Core + worker types; failing test that `chooseThiefStep` still returns exit step**

Keep existing solver tests green as regression.

- [ ] **Step 2: Implement `chooseThiefStep` degradation**

```ts
export function chooseThiefStep(state: ThiefSiegeState, budget?: AdversaryBudget): ThiefSiegeMove | null {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing' || normalized.phase !== 'thief') return null;

  const deep = searchAdversary(normalized, budget ?? { timeMs: 80, maxDepth: 6, maxPlaceBranch: 10 });
  if (deep.move?.type === 'step') return deep.move;

  // existing BFS greedy…
}
```

`solveThiefSiege`: use `searchAdversary` on cop phase for recommended place; set `stats.solverName` to include tier (`escape-adversary/perfect|bounded|bfs`).

- [ ] **Step 3: `getAIMoveAsync` in index.tsx**

Sync `getAIMove` remains BFS-fast for Node/tests. Async version used by web:

```ts
getAIMoveAsync: async (s) => {
  const budget = s.width <= 11
    ? { timeMs: 800, maxDepth: Infinity, maxPlaceBranch: 14 }
    : s.width <= 15
      ? { timeMs: 500, maxDepth: 10, maxPlaceBranch: 12 }
      : { timeMs: 350, maxDepth: 6, maxPlaceBranch: 10 };
  const result = searchAdversary(s, budget);
  if (result.move) return { move: result.move, delay: Math.max(200, result.timeMs), tier: result.tier };
  const fallback = chooseThiefStep(s);
  return fallback ? { move: fallback, delay: 200, tier: 'bfs' } : null;
},
```

Worker path: `scheduleAI` posts `ai-move` to worker which calls the same `searchAdversary` / `chooseThiefStep` and returns move+tier; main thread `applyMove` after response. If worker fails, call `getAIMoveAsync` on main or sync `getAIMove`.

- [ ] **Step 4: Update `scheduleAI`**

```ts
export function scheduleAI(get: SolverStoreGet): void {
  if (aiTimerId) clearTimeout(aiTimerId);
  aiTimerId = setTimeout(async () => {
    aiTimerId = null;
    const s = get();
    if (!s.plugin?.ai || !s.gameState || s.solvePlayback) return;
    if (!s.plugin.ai.isAITurn(s.gameState)) return;

    // set thinking flag if store supports it; else skip
    let action: { move: Move; delay: number } | null = null;
    if (s.plugin.metadata.id === 'thief-siege' && usesWebWorker(s.plugin)) {
      action = await requestThiefSiegeAiMove(s.gameState); // Worker wrapper
    } else if (s.plugin.ai.getAIMoveAsync) {
      action = await s.plugin.ai.getAIMoveAsync(s.gameState);
    } else {
      action = s.plugin.ai.getAIMove(s.gameState);
    }
    if (!action) return;
    const wait = Math.max(0, action.delay ?? 0);
    await new Promise(r => setTimeout(r, Math.min(wait, 50))); // optional micro-delay; primary wait was Worker time
    const latest = get();
    if (!latest.plugin?.ai?.isAITurn(latest.gameState!)) return;
    get().applyMove(action.move);
  }, 0); // do not force 600ms for async games; keep 600 only for sync AI games
}
```

Preserve 600ms behavior for Nim/Wythoff (sync-only). For thief-siege use Worker elapsed time.

Set `platformSupport` web `webWorker: true` for thief-siege.

- [ ] **Step 5: Run**

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(thief-siege): worker adversarial AI with degradation"
```

---

### Task 5: Education, docs, PROGRESS

**Files:**
- Modify: `packages/education/src/content/thief-siege/l2.zh-CN.md`, `l2.en.md`, `l3.zh-CN.md`, `l3.en.md`
- Modify: `docs/games/thief-siege.md`
- Modify: `docs/DECISIONS.md` — ADR-023 (or next id) thief-siege v1.1
- Modify: `docs/PROGRESS.md`
- Modify: i18n strings for guarantee copy / thinking if not done in Task 4

- [ ] **Step 1: Update L2** — one paragraph: blocking future escapes; difficulty sizes; easy verified winnable

- [ ] **Step 2: Update L3** — adversarial search, Worker, degradation, mid/hard constructive guarantee honesty

- [ ] **Step 3: Developer doc + ADR**

ADR summary bullets:
- Sizes 11/15/19
- Hybrid win guarantee
- Adversary AI + Worker + fallback BFS

- [ ] **Step 4: Full verify**

```bash
pnpm test:run
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "docs(thief-siege): v1.1 education and ADR"
```

- [ ] **Step 6: Update PROGRESS** — v1.1 DONE; NEXT = Angel and Devil or polish

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| §3 sizes 11/15/19 | Task 1 |
| §4 hybrid win guarantee | Task 3 (engine Task 2) |
| §5 adversary AI + Worker + degradation | Task 2 + 4 |
| §5.5 hint/solve shared engine | Task 4 (`solveThiefSiege`) |
| §5.6 thinking / delay | Task 4 |
| §6 education/docs | Task 5 |
| §7 DoD | Tasks 1–5 + final verify |
| §8 non-goals | Explicitly skipped |

## Placeholder scan

No TBD steps; budgets are concrete numbers (tunable later via constants at top of `adversary.ts`).

## Type consistency

- `AdversaryBudget` / `AdversaryMoveResult` / `AdversaryTier` defined in Task 2, reused in 3–4
- Worker `'ai-move'` + optional `getAIMoveAsync` introduced in Task 4
- Size set `{11,15,19}` consistent across Task 1 and 3
