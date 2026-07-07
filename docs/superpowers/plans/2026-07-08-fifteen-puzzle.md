# 15-Puzzle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 15-puzzle (数字华容道) as Ludus's 6th game — 4×4 sliding tile puzzle with A* solver, scramble-based generator, and search tree visualization.

**Architecture:** Self-contained game module in `packages/games/src/fifteen/` following ADR-023 plugin pattern. Core logic (types/rules/solver/generator/difficulty) is framework-free pure TS. A* solver uses Manhattan distance heuristic and runs in Web Worker to avoid UI blocking. Render uses CSS Grid + Framer Motion layout animations. Visualization is a custom SVG component showing the solution path with f/g/h annotations.

**Tech Stack:** TypeScript, React, Framer Motion, Tailwind CSS, Vite (?worker import), Vitest

## Global Constraints

- All user-facing strings via `t()` i18n — zero hardcoded Chinese/English
- `GamePluginEntry` export with BoardComponent / isOwnState / moveToHighlight / i18n / education
- solver pure TS, framework-free, returns `Solution` with `trace.type = 'a-star-search'`
- Generator: random walk from solved state, guaranteed solvable
- `getDifficulty` and `computeDifficulty` use same formula (scramble depth / 80)
- Animation uses `transform`/`opacity`, no `transition-all` or `width`/`height` transitions
- Worker integration for A* solver (non-blocking UI)
- Tests: solver correctness, generator solvability, rules engine, difficulty formula
- New game = add directory + registry 1 line + entrySetup 1 block — no other file changes

---

### Task 1: Core types and rules engine

**Files:**
- Create: `packages/games/src/fifteen/types.ts`
- Create: `packages/games/src/fifteen/rules.ts`

**Interfaces:**
- Produces: `FifteenState { grid: number[] }`, `FifteenMove { tileIndex: number }`
- Produces: `createInitialState()`, `legalMoves(state)`, `applyMove(state, move)`, `isSolved(state)`, `getDifficulty(state)`, `serializeGrid(grid)`

- [ ] **Step 1: Write types.ts**

```ts
import type { GameState, Move } from '@ludus/core';

export interface FifteenState extends GameState {
  grid: number[]; // 16 elements, row-major, 0 = empty
}

export interface FifteenMove extends Move {
  tileIndex: number; // index of the tile being slid into the empty space
}

export const GOAL_GRID: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];

export const SIZE = 4;
```

- [ ] **Step 2: Write rules.ts**

```ts
import type { Difficulty, Solution } from '@ludus/core';
import type { FifteenState, FifteenMove } from './types';
import { GOAL_GRID, SIZE } from './types';
import { computeFifteenDifficulty } from './difficulty';

export type { FifteenState, FifteenMove };

export function createInitialState(): FifteenState {
  return { grid: [...GOAL_GRID] };
}

export function serializeGrid(grid: number[]): string {
  return grid.join(',');
}

function findEmpty(grid: number[]): number {
  return grid.indexOf(0);
}

export function legalMoves(state: FifteenState): FifteenMove[] {
  const emptyIdx = findEmpty(state.grid);
  const row = Math.floor(emptyIdx / SIZE);
  const col = emptyIdx % SIZE;
  const moves: FifteenMove[] = [];
  if (row > 0) moves.push({ tileIndex: emptyIdx - SIZE }); // tile below slides up
  if (row < SIZE - 1) moves.push({ tileIndex: emptyIdx + SIZE }); // tile above slides down
  if (col > 0) moves.push({ tileIndex: emptyIdx - 1 }); // tile right slides left
  if (col < SIZE - 1) moves.push({ tileIndex: emptyIdx + 1 }); // tile left slides right
  return moves;
}

export function applyMove(state: FifteenState, move: FifteenMove): FifteenState {
  const emptyIdx = findEmpty(state.grid);
  const { tileIndex } = move;
  // Validate adjacency
  const dr = Math.abs(Math.floor(tileIndex / SIZE) - Math.floor(emptyIdx / SIZE));
  const dc = Math.abs((tileIndex % SIZE) - (emptyIdx % SIZE));
  if (dr + dc !== 1) return state;
  if (state.grid[tileIndex] === 0) return state;

  const newGrid = [...state.grid];
  newGrid[emptyIdx] = newGrid[tileIndex]!;
  newGrid[tileIndex] = 0;
  return { grid: newGrid };
}

export function isSolved(state: FifteenState): boolean {
  for (let i = 0; i < 16; i++) {
    if (state.grid[i] !== GOAL_GRID[i]) return false;
  }
  return true;
}

export function getDifficulty(state: FifteenState): Difficulty {
  // getDifficulty takes the current state — we use a placeholder score
  // since the "true" difficulty is set at generation time
  return computeFifteenDifficulty(0);
}
```

- [ ] **Step 3: Verify types compile**

Run: `cd /Users/zxj/Desktop/Ludus && npx tsc --noEmit -p packages/games/tsconfig.json 2>&1 | head -20`
Expected: no errors related to fifteen (difficulty.ts won't exist yet — that's Task 4)

---

### Task 2: A* solver

**Files:**
- Create: `packages/games/src/fifteen/solver.ts`

**Interfaces:**
- Consumes: `FifteenState`, `FifteenMove`, `GOAL_GRID`, `SIZE` from types.ts; `serializeGrid` from rules.ts
- Produces: `solveFifteen(state: FifteenState): Solution`, `manhattanDistance(grid: number[]): number`, `AStarNode` interface

- [ ] **Step 1: Write solver.ts**

```ts
import type { Solution } from '@ludus/core';
import type { FifteenState, FifteenMove } from './types';
import { GOAL_GRID, SIZE } from './types';

export interface AStarNode {
  grid: number[];
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
  move: number | null; // tileIndex that was moved
}

export function manhattanDistance(grid: number[]): number {
  let dist = 0;
  for (let i = 0; i < 16; i++) {
    const val = grid[i]!;
    if (val === 0) continue;
    const targetRow = Math.floor((val - 1) / SIZE);
    const targetCol = (val - 1) % SIZE;
    const currentRow = Math.floor(i / SIZE);
    const currentCol = i % SIZE;
    dist += Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
  }
  return dist;
}

function findEmpty(grid: number[]): number {
  return grid.indexOf(0);
}

function getNeighborTiles(grid: number[]): number[] {
  const emptyIdx = findEmpty(grid);
  const row = Math.floor(emptyIdx / SIZE);
  const col = emptyIdx % SIZE;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(emptyIdx - SIZE);
  if (row < SIZE - 1) neighbors.push(emptyIdx + SIZE);
  if (col > 0) neighbors.push(emptyIdx - 1);
  if (col < SIZE - 1) neighbors.push(emptyIdx + 1);
  return neighbors;
}

// Min-heap for A* priority queue
class MinHeap {
  private heap: AStarNode[] = [];

  push(node: AStarNode): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): AStarNode | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number { return this.heap.length; }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent]!.f <= this.heap[idx]!.f) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx]!, this.heap[parent]!];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const len = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < len && this.heap[left]!.f < this.heap[smallest]!.f) smallest = left;
      if (right < len && this.heap[right]!.f < this.heap[smallest]!.f) smallest = right;
      if (smallest === idx) break;
      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest]!, this.heap[idx]!];
      idx = smallest;
    }
  }
}

export function solveFifteen(state: FifteenState): Solution {
  const startTime = performance.now();
  const startGrid = state.grid;

  const startH = manhattanDistance(startGrid);
  const startNode: AStarNode = { grid: startGrid, g: 0, h: startH, f: startH, parent: null, move: null };

  const openSet = new MinHeap();
  openSet.push(startNode);
  const closedSet = new Set<string>();

  let nodesExplored = 0;
  const goalKey = GOAL_GRID.join(',');

  // Collect trace nodes along the solution path
  const traceNodes: { grid: number[]; g: number; h: number; f: number }[] = [];

  while (openSet.size > 0) {
    const current = openSet.pop()!;
    nodesExplored++;

    const key = current.grid.join(',');
    if (key === goalKey) {
      // Reconstruct path
      const moves: FifteenMove[] = [];
      const pathNodes: { grid: number[]; g: number; h: number; f: number }[] = [];
      let node: AStarNode | null = current;
      while (node) {
        if (node.move !== null) {
          moves.unshift({ tileIndex: node.move });
        }
        pathNodes.unshift({ grid: [...node.grid], g: node.g, h: node.h, f: node.f });
        node = node.parent;
      }

      const timeMs = Math.round(performance.now() - startTime);
      return {
        solvable: true,
        moves,
        trace: {
          type: 'a-star-search',
          steps: pathNodes.map((n, i) => ({
            description: `Step ${i}: g=${n.g}, h=${n.h}, f=${n.f}`,
            data: { grid: n.grid, g: n.g, h: n.h, f: n.f, step: i },
          })),
          visualizationData: {
            nodesExplored,
            solutionLength: moves.length,
            pathNodes,
            timeMs,
          },
        },
        stats: {
          nodesExplored,
          timeMs,
          solutionLength: moves.length,
          solverName: 'A* (Manhattan distance)',
          terminated: 'solved',
        },
      };
    }

    if (closedSet.has(key)) continue;
    closedSet.add(key);

    const neighbors = getNeighborTiles(current.grid);
    for (const tileIdx of neighbors) {
      const emptyIdx = findEmpty(current.grid);
      const newGrid = [...current.grid];
      newGrid[emptyIdx] = newGrid[tileIdx]!;
      newGrid[tileIdx] = 0;

      const newKey = newGrid.join(',');
      if (closedSet.has(newKey)) continue;

      const g = current.g + 1;
      const h = manhattanDistance(newGrid);
      openSet.push({ grid: newGrid, g, h, f: g + h, parent: current, move: tileIdx });
    }
  }

  const timeMs = Math.round(performance.now() - startTime);
  return {
    solvable: false,
    moves: [],
    stats: {
      nodesExplored,
      timeMs,
      solutionLength: 0,
      solverName: 'A* (Manhattan distance)',
      terminated: 'exhausted',
    },
  };
}
```

- [ ] **Step 2: Verify compile**

Run: `cd /Users/zxj/Desktop/Ludus && npx tsc --noEmit -p packages/games/tsconfig.json 2>&1 | head -20`
Expected: no errors (except for missing difficulty.ts import in rules.ts)

---

### Task 3: Generator (random walk from solved)

**Files:**
- Create: `packages/games/src/fifteen/generator.ts`

**Interfaces:**
- Consumes: `FifteenState`, `FifteenMove`, `GOAL_GRID` from types.ts; `legalMoves`, `applyMove` from rules.ts
- Produces: `generateFifteenLevel(config: LevelConfig): Level`

- [ ] **Step 1: Write generator.ts**

```ts
import type { Level, LevelConfig } from '@ludus/core';
import type { FifteenState, FifteenMove } from './types';
import { GOAL_GRID } from './types';
import { legalMoves, applyMove } from './rules';
import { computeFifteenDifficulty } from './difficulty';

function scrambleDepthFromRange(range: [number, number]): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 33) return 10 + Math.floor(Math.random() * 11);  // 10-20
  if (mid <= 66) return 20 + Math.floor(Math.random() * 21);  // 20-40
  return 40 + Math.floor(Math.random() * 41);                   // 40-80
}

export function generateFifteenLevel(config: LevelConfig): Level {
  const depth = config.gameParams?.scrambleDepth as number | undefined
    ?? scrambleDepthFromRange(config.difficultyRange);

  let state: FifteenState = { grid: [...GOAL_GRID] };
  let lastEmptyIdx = -1;

  for (let i = 0; i < depth; i++) {
    const moves = legalMoves(state);
    // Avoid reversing the previous move
    const filtered = moves.filter(m => {
      const nextState = applyMove(state, m);
      return nextState.grid.indexOf(0) !== lastEmptyIdx;
    });
    const chosen = filtered.length > 0
      ? filtered[Math.floor(Math.random() * filtered.length)]!
      : moves[Math.floor(Math.random() * moves.length)]!;

    lastEmptyIdx = state.grid.indexOf(0);
    state = applyMove(state, chosen);
  }

  // Check we didn't accidentally solve it
  const isAlreadySolved = state.grid.every((v, i) => v === GOAL_GRID[i]);

  const difficulty = computeFifteenDifficulty(isAlreadySolved ? 0 : depth);

  return {
    schemaVersion: 1,
    gameId: 'fifteen',
    levelId: `fifteen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialState: { grid: state.grid } as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'random-walk',
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Verify compile** (will fail until difficulty.ts is created — Task 4)

---

### Task 4: Difficulty formula

**Files:**
- Create: `packages/games/src/fifteen/difficulty.ts`

**Interfaces:**
- Produces: `computeFifteenDifficulty(scrambleDepth: number): Difficulty`

- [ ] **Step 1: Write difficulty.ts**

```ts
import type { Difficulty } from '@ludus/core';

export function computeFifteenDifficulty(scrambleDepth: number): Difficulty {
  const score = Math.min(100, Math.round((scrambleDepth / 80) * 100));

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: { scrambleDepth },
    labelKey,
  };
}
```

- [ ] **Step 2: Verify compile**

Run: `cd /Users/zxj/Desktop/Ludus && npx tsc --noEmit -p packages/games/tsconfig.json 2>&1 | head -20`
Expected: no errors

---

### Task 5: Tests for core logic

**Files:**
- Create: `packages/games/src/fifteen/rules.test.ts`
- Create: `packages/games/src/fifteen/solver.test.ts`
- Create: `packages/games/src/fifteen/generator.test.ts`
- Create: `packages/games/src/fifteen/difficulty.test.ts`

**Interfaces:**
- Consumes: all functions from rules.ts, solver.ts, generator.ts, difficulty.ts

- [ ] **Step 1: Write rules.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved } from './rules';
import { GOAL_GRID } from './types';
import type { FifteenState, FifteenMove } from './types';

describe('Fifteen rules', () => {
  it('initial state is solved', () => {
    expect(isSolved(createInitialState())).toBe(true);
  });

  it('legalMoves returns 2 moves for corner empty', () => {
    // Empty at (0,0) → tiles at (0,1) and (1,0) can slide
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const moves = legalMoves(state);
    expect(moves).toHaveLength(2);
    expect(moves.map(m => m.tileIndex).sort()).toEqual([1, 4]);
  });

  it('legalMoves returns 3 moves for edge empty', () => {
    // Empty at (0,1)
    const state: FifteenState = { grid: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const moves = legalMoves(state);
    expect(moves).toHaveLength(3);
  });

  it('legalMoves returns 4 moves for center empty', () => {
    // Empty at (1,1)
    const grid = [...GOAL_GRID];
    grid[5] = 0; // position (1,1)
    grid[15] = 5;
    const state: FifteenState = { grid };
    const moves = legalMoves(state);
    expect(moves).toHaveLength(4);
  });

  it('applyMove swaps tile with empty', () => {
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const newState = applyMove(state, { tileIndex: 1 });
    expect(newState.grid[0]).toBe(1);
    expect(newState.grid[1]).toBe(0);
  });

  it('applyMove rejects non-adjacent tile', () => {
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const newState = applyMove(state, { tileIndex: 15 });
    expect(newState).toBe(state); // Same reference = no change
  });

  it('applyMove rejects empty tile', () => {
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const newState = applyMove(state, { tileIndex: 0 });
    expect(newState).toBe(state);
  });

  it('sequence of moves from solved produces non-solved state', () => {
    let state: FifteenState = { grid: [...GOAL_GRID] };
    // Move tile 15 left (swap with empty below)
    state = applyMove(state, { tileIndex: 15 });
    expect(isSolved(state)).toBe(false);
  });

  it('undo sequence restores solved', () => {
    let state: FifteenState = { grid: [...GOAL_GRID] };
    // Move 15 right → empty moves left. Actually: empty at 15, tile 15 is at 15...
    // Empty at (3,3), tile above is at (2,3)=11
    state = applyMove(state, { tileIndex: 11 });
    expect(isSolved(state)).toBe(false);
    const moves = legalMoves(state);
    const undoMove = moves.find(m => m.tileIndex === 11);
    expect(undoMove).toBeDefined();
    if (undoMove) {
      state = applyMove(state, undoMove);
      expect(isSolved(state)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run rules tests**

Run: `cd /Users/zxj/Desktop/Ludus && npx vitest run packages/games/src/fifteen/rules.test.ts`
Expected: 8 passing

- [ ] **Step 3: Write solver.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { solveFifteen, manhattanDistance } from './solver';
import { GOAL_GRID } from './types';
import type { FifteenState } from './types';

describe('Fifteen solver', () => {
  it('manhattanDistance is 0 for solved state', () => {
    expect(manhattanDistance(GOAL_GRID)).toBe(0);
  });

  it('manhattanDistance correct for one tile displaced', () => {
    // Swap 1 and 2: [2,1,3,4,5,...]
    const grid = [...GOAL_GRID];
    grid[0] = 2;
    grid[1] = 1;
    // 2 at (0,0) should be at (0,1): dist=1. 1 at (0,1) should be at (0,0): dist=1. Total=2
    expect(manhattanDistance(grid)).toBe(2);
  });

  it('manhattanDistance correct for tile at opposite corner', () => {
    // 1 at (3,3) instead of (0,0): dist=6
    const grid = [...GOAL_GRID];
    grid[15] = 1;
    grid[0] = 0; // empty now at (0,0)
    // 1 at (3,3) should be at (0,0): |3-0|+|3-0|=6
    expect(manhattanDistance(grid)).toBe(6);
  });

  it('solves already-solved state', () => {
    const state: FifteenState = { grid: [...GOAL_GRID] };
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves).toHaveLength(0);
    expect(sol.stats.solutionLength).toBe(0);
  });

  it('solves one-move scramble', () => {
    // Move tile 15 left (swap with empty at 14)
    const grid = [...GOAL_GRID];
    grid[15] = 14;
    grid[14] = 0;
    const state: FifteenState = { grid };
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves).toHaveLength(1);
    expect(sol.moves[0]!.tileIndex).toBe(14);
    expect(sol.stats.terminated).toBe('solved');
    expect(sol.trace!.type).toBe('a-star-search');
  });

  it('solves two-move scramble', () => {
    // Move 15 left, then 11 down
    const grid = [...GOAL_GRID];
    // Start from solved, apply moves manually
    grid[15] = 11; // 11 at (2,3) moved down to (3,3)
    grid[11] = 15; // 15 at (3,3) moved up to (2,3)
    // Wait, that's swapping. Let me just use a known 2-move scramble:
    // swap 14 and 15: grid[14]=15, grid[15]=14
    const grid2 = [...GOAL_GRID];
    grid2[14] = 15;
    grid2[15] = 14;
    const state: FifteenState = { grid: grid2 };
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.stats.solutionLength).toBeGreaterThanOrEqual(2);
  });

  it('solves 5-move scramble within reasonable nodes', () => {
    // 5 moves from solved
    const grid = [...GOAL_GRID];
    // Scramble: move 15 left, 14 left, 10 down, 11 right, 15 up
    // Just swap a few tiles to simulate a few moves:
    // Actually let's construct something that's 3 moves away:
    // [1,2,3,4,5,6,7,8,9,10,11,0,13,14,15,12] — 12 needs to go to (2,3), easy
    const easy: FifteenState = {
      grid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15],
    };
    const sol = solveFifteen(easy);
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBe(1);
    expect(sol.stats.nodesExplored).toBeLessThan(100);
  });

  it('trace contains path nodes with f/g/h', () => {
    const grid = [...GOAL_GRID];
    grid[15] = 14;
    grid[14] = 0;
    const state: FifteenState = { grid };
    const sol = solveFifteen(state);
    expect(sol.trace).toBeDefined();
    expect(sol.trace!.type).toBe('a-star-search');
    expect(sol.trace!.steps.length).toBeGreaterThan(0);
    const lastStep = sol.trace!.steps[sol.trace!.steps.length - 1]!;
    expect(lastStep.data).toHaveProperty('g');
    expect(lastStep.data).toHaveProperty('h');
    expect(lastStep.data).toHaveProperty('f');
  });
});
```

- [ ] **Step 4: Run solver tests**

Run: `cd /Users/zxj/Desktop/Ludus && npx vitest run packages/games/src/fifteen/solver.test.ts`
Expected: 8 passing

- [ ] **Step 5: Write generator.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { generateFifteenLevel } from './generator';
import { isSolved } from './rules';
import { solveFifteen } from './solver';
import { GOAL_GRID } from './types';
import type { FifteenState } from './types';

describe('Fifteen generator', () => {
  it('generates a non-solved state', () => {
    const level = generateFifteenLevel({ difficultyRange: [20, 80] });
    const state = level.initialState as unknown as FifteenState;
    expect(isSolved(state)).toBe(false);
  });

  it('generated state is solvable', () => {
    const level = generateFifteenLevel({ difficultyRange: [10, 50] });
    const state = level.initialState as unknown as FifteenState;
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBeGreaterThan(0);
  });

  it('respects gameParams.scrambleDepth', () => {
    const level = generateFifteenLevel({
      difficultyRange: [10, 50],
      gameParams: { scrambleDepth: 15 },
    });
    const state = level.initialState as unknown as FifteenState;
    const sol = solveFifteen(state);
    // Solution length should be ≤ scramble depth
    expect(sol.stats.solutionLength).toBeLessThanOrEqual(15);
  });

  it('generates different states on successive calls', () => {
    const level1 = generateFifteenLevel({ difficultyRange: [20, 80] });
    const level2 = generateFifteenLevel({ difficultyRange: [20, 80] });
    const grid1 = (level1.initialState as unknown as FifteenState).grid;
    const grid2 = (level2.initialState as unknown as FifteenState).grid;
    const same = grid1.every((v, i) => v === grid2[i]);
    expect(same).toBe(false);
  });

  it('easy difficulty produces low scramble depth', () => {
    const level = generateFifteenLevel({ difficultyRange: [0, 20] });
    const state = level.initialState as unknown as FifteenState;
    const sol = solveFifteen(state);
    // Easy should be ≤ 20 moves from solved
    expect(sol.stats.solutionLength).toBeLessThanOrEqual(20);
  });

  it('difficulty label is set', () => {
    const level = generateFifteenLevel({ difficultyRange: [20, 50] });
    expect(level.difficulty.labelKey).toBeDefined();
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 6: Run generator tests**

Run: `cd /Users/zxj/Desktop/Ludus && npx vitest run packages/games/src/fifteen/generator.test.ts`
Expected: 6 passing (A* may take time for some, but within limits)

- [ ] **Step 7: Write difficulty.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { computeFifteenDifficulty } from './difficulty';

describe('Fifteen difficulty', () => {
  it('score 0 for depth 0', () => {
    const d = computeFifteenDifficulty(0);
    expect(d.score).toBe(0);
    expect(d.labelKey).toBe('difficulty.easy');
  });

  it('score 13 for depth 10', () => {
    const d = computeFifteenDifficulty(10);
    expect(d.score).toBe(13);
  });

  it('score 50 for depth 40', () => {
    const d = computeFifteenDifficulty(40);
    expect(d.score).toBe(50);
  });

  it('score 100 for depth 80', () => {
    const d = computeFifteenDifficulty(80);
    expect(d.score).toBe(100);
  });

  it('caps at 100 for depth > 80', () => {
    const d = computeFifteenDifficulty(100);
    expect(d.score).toBe(100);
    expect(d.labelKey).toBe('difficulty.hard');
  });

  it('factors contains scrambleDepth', () => {
    const d = computeFifteenDifficulty(25);
    expect(d.factors.scrambleDepth).toBe(25);
  });
});
```

- [ ] **Step 8: Run difficulty tests**

Run: `cd /Users/zxj/Desktop/Ludus && npx vitest run packages/games/src/fifteen/difficulty.test.ts`
Expected: 6 passing

- [ ] **Step 9: Run all fifteen tests**

Run: `cd /Users/zxj/Desktop/Ludus && npx vitest run packages/games/src/fifteen/`
Expected: all ~28 tests passing

---

### Task 6: i18n translations

**Files:**
- Create: `packages/games/src/fifteen/i18n.ts`

**Interfaces:**
- Produces: `fifteenI18n: { zhCN: Record<string,string>, en: Record<string,string> }`

- [ ] **Step 1: Write i18n.ts**

```ts
export const fifteenI18n = {
  zhCN: {
    'game.fifteen.name': '15-Puzzle 数字华容道',
    'game.fifteen.description': '滑动数字块重新排列——用 A* 搜索与曼哈顿距离启发式找到最短路径',
    'category.search': '搜索算法',
    'fifteen.empty': '空位',
    'fifteen.tileAria': '数字 {{value}}，第 {{row}} 行第 {{col}} 列',
    'fifteen.moveAria': '将数字 {{value}} 滑入空位',
    'fifteen.steps': '步数',
    'fifteen.scrambleDepth': '打乱步数',
    'fifteen.manhattanDist': '曼哈顿距离',
    'fifteen.heuristic': '启发式',
    'fifteen.fValue': 'f 值',
    'fifteen.gValue': 'g 值（已走步数）',
    'fifteen.hValue': 'h 值（启发式估计）',
    'fifteen.solutionPath': '最优解路径',
    'fifteen.searchTree': 'A* 搜索树',
    'fifteen.nodesExplored': '搜索节点数',
    'fifteen.solverName': 'A* (曼哈顿距离)',
  },
  en: {
    'game.fifteen.name': '15-Puzzle',
    'game.fifteen.description': 'Slide numbered tiles to reorder them — use A* search with Manhattan distance heuristic to find the shortest path',
    'category.search': 'Search Algorithms',
    'fifteen.empty': 'Empty',
    'fifteen.tileAria': 'Tile {{value}}, row {{row}} column {{col}}',
    'fifteen.moveAria': 'Slide tile {{value}} into the empty space',
    'fifteen.steps': 'Steps',
    'fifteen.scrambleDepth': 'Scramble Depth',
    'fifteen.manhattanDist': 'Manhattan Distance',
    'fifteen.heuristic': 'Heuristic',
    'fifteen.fValue': 'f-value',
    'fifteen.gValue': 'g-value (cost so far)',
    'fifteen.hValue': 'h-value (heuristic estimate)',
    'fifteen.solutionPath': 'Solution Path',
    'fifteen.searchTree': 'A* Search Tree',
    'fifteen.nodesExplored': 'Nodes Explored',
    'fifteen.solverName': 'A* (Manhattan Distance)',
  },
};
```

---

### Task 7: Education and visualization manifests

**Files:**
- Create: `packages/games/src/fifteen/manifest.ts`

- [ ] **Step 1: Write manifest.ts**

```ts
import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const fifteenEducationManifest: EducationManifest = {
  gameId: 'fifteen',
  l2ContentPaths: {
    'zh-CN': '/content/fifteen/l2.zh-CN.md',
    en: '/content/fifteen/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/fifteen/l3.zh-CN.md',
    en: '/content/fifteen/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '启发式搜索 — A* 算法与可采纳启发式',
    en: 'Heuristic Search — A* Algorithm and Admissible Heuristics',
  },
  complexityClass: 'NP-hard (general n×n); 4×4 instance solves in < 1s with A* + Manhattan heuristic',
  knowledgeTags: ['启发式搜索', 'A*', '曼哈顿距离', '可采纳启发式', '优先队列', '状态空间搜索'],
};

export const fifteenVisualizationManifest: VisualizationManifest = {
  gameId: 'fifteen',
  traceType: 'a-star-search',
  componentName: 'FifteenTreeViz',
  library: 'custom-svg',
};
```

---

### Task 8: Board render component

**Files:**
- Create: `packages/games/src/fifteen/render.tsx`

**Interfaces:**
- Consumes: `FifteenState`, `FifteenMove` from types.ts; `legalMoves` from rules.ts
- Produces: `FifteenBoard` component with Props: state, onMove, disabled, highlightCell

- [ ] **Step 1: Write render.tsx**

```tsx
import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FifteenState, FifteenMove } from './types';
import { SIZE } from './types';
import { legalMoves } from './rules';

interface Props {
  state: FifteenState;
  onMove: (move: FifteenMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number; value?: number } | null;
}

const TILE_COLORS = [
  '', // 0 = empty, unused
  'bg-logic-indigo-500 text-white shadow-logic-indigo/20',
  'bg-logic-indigo-400 text-white shadow-logic-indigo/15',
  'bg-logic-indigo-600 text-white shadow-logic-indigo/25',
  'bg-clarity-teal-500 text-white shadow-clarity-teal/20',
  'bg-clarity-teal-400 text-white shadow-clarity-teal/15',
  'bg-clarity-teal-600 text-white shadow-clarity-teal/25',
  'bg-game-amber-500 text-white shadow-game-amber/20',
  'bg-game-amber-400 text-white shadow-game-amber/15',
  'bg-game-amber-600 text-white shadow-game-amber/25',
  'bg-logic-indigo-500 text-white shadow-logic-indigo/20',
  'bg-logic-indigo-400 text-white shadow-logic-indigo/15',
  'bg-clarity-teal-500 text-white shadow-clarity-teal/20',
  'bg-clarity-teal-400 text-white shadow-clarity-teal/15',
  'bg-game-amber-500 text-white shadow-game-amber/20',
  'bg-game-amber-400 text-white shadow-game-amber/15',
];

export function FifteenBoard({ state, onMove, disabled, highlightCell }: Props) {
  const { grid } = state;
  const { t } = useTranslation();
  const isWin = grid.every((v, i) => v === [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0][i]);

  const movableTiles = new Set(legalMoves(state).map(m => m.tileIndex));
  const hintIdx = highlightCell != null ? highlightCell.row * SIZE + highlightCell.col : -1;

  const handleTileClick = (idx: number) => {
    if (disabled || isWin) return;
    if (!movableTiles.has(idx)) return;
    onMove({ tileIndex: idx });
  };

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || isWin) return;
    const emptyIdx = grid.indexOf(0);
    const row = Math.floor(emptyIdx / SIZE);
    const col = emptyIdx % SIZE;
    let tileIdx = -1;
    if (e.key === 'ArrowUp' && row < SIZE - 1) tileIdx = emptyIdx + SIZE;
    else if (e.key === 'ArrowDown' && row > 0) tileIdx = emptyIdx - SIZE;
    else if (e.key === 'ArrowLeft' && col < SIZE - 1) tileIdx = emptyIdx + 1;
    else if (e.key === 'ArrowRight' && col > 0) tileIdx = emptyIdx - 1;
    if (tileIdx >= 0) {
      e.preventDefault();
      onMove({ tileIndex: tileIdx });
    }
  }, [disabled, isWin, grid, onMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div
        className="grid gap-1.5 p-3 rounded-2xl bg-warm-stone-100 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
      >
        {grid.map((val, idx) => {
          if (val === 0) {
            return (
              <div
                key="empty"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-warm-stone-300 bg-warm-stone-50/50"
                aria-label={t('fifteen.empty')}
              />
            );
          }

          const row = Math.floor(idx / SIZE);
          const col = idx % SIZE;
          const isMovable = movableTiles.has(idx);
          const isHinted = idx === hintIdx;
          const colorClass = TILE_COLORS[val] || 'bg-warm-stone-500 text-white';

          return (
            <motion.button
              key={val}
              type="button"
              layout
              onClick={() => handleTileClick(idx)}
              disabled={!isMovable || disabled || isWin}
              className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-xl font-bold text-xl sm:text-2xl
                flex items-center justify-center
                transition-shadow duration-150
                ${colorClass}
                ${isMovable ? 'cursor-pointer hover:brightness-110 hover:shadow-lg' : 'cursor-default opacity-60'}
                ${isHinted ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : ''}
                ${isWin ? 'brightness-110' : ''}
                shadow-md
              `}
              style={{ aspectRatio: '1' }}
              aria-label={t('fifteen.tileAria', { value: val, row: row + 1, col: col + 1 })}
              whileTap={isMovable ? { scale: 0.9 } : {}}
            >
              {val}
            </motion.button>
          );
        })}
      </div>

      {isWin && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold text-game-amber-600"
        >
          ✓ Solved!
        </motion.div>
      )}
    </div>
  );
}
```

---

### Task 9: Plugin entry (index.tsx)

**Files:**
- Create: `packages/games/src/fifteen/index.tsx`

**Interfaces:**
- Consumes: all fifteen modules
- Produces: `fifteenPlugin: GamePlugin<FifteenState, FifteenMove>`, `fifteenEntry: GamePluginEntry<FifteenState, FifteenMove>`

- [ ] **Step 1: Write index.tsx**

```tsx
import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generateFifteenLevel } from './generator';
import { createInitialState, legalMoves, applyMove, isSolved, getDifficulty } from './rules';
import type { FifteenState, FifteenMove } from './types';
import { SIZE } from './types';
import { solveFifteen } from './solver';
import { fifteenEducationManifest, fifteenVisualizationManifest } from './manifest';
import { FifteenBoard } from './render';
import { fifteenI18n } from './i18n';

export { fifteenI18n };

const metadata = {
  id: 'fifteen',
  nameKey: 'game.fifteen.name',
  descriptionKey: 'game.fifteen.description',
  category: 'category.search',
  icon: '🧩',
  isFastSolver: false, // A* may take time — use background solve
  tags: ['15-puzzle', '华容道', 'A*', '启发式搜索', '曼哈顿距离', '滑动拼图'],
  renderBackend: 'dom' as const,
  platformSupport: [
    {
      platform: 'web' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
    },
    {
      platform: 'desktop' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
    },
    {
      platform: 'mobile' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
    },
  ],
  version: '0.1.0',
};

export const fifteenPlugin: GamePlugin<FifteenState, FifteenMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateFifteenLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: FifteenState): Solution => solveFifteen(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: fifteenEducationManifest,
  visualizationManifest: fifteenVisualizationManifest,
};

// ═══════════════════════════════════════════════════════════════
// GamePluginEntry
// ═══════════════════════════════════════════════════════════════

export const fifteenEntry: GamePluginEntry<FifteenState, FifteenMove> = {
  plugin: fifteenPlugin,
  BoardComponent: FifteenBoard,
  isOwnState: (state): state is FifteenState =>
    state != null && 'grid' in state && Array.isArray((state as FifteenState).grid) && (state as FifteenState).grid.length === 16,
  moveToHighlight: (move) => {
    if (!move || move.tileIndex == null) return null;
    const idx = move.tileIndex;
    return { row: Math.floor(idx / SIZE), col: idx % SIZE };
  },
  i18n: { namespace: 'fifteen', zhCN: fifteenI18n.zhCN, en: fifteenI18n.en },
  education: { content: {} },
};
```

---

### Task 10: Wire up — registry, core types, web i18n, entrySetup, worker

**Files:**
- Modify: `packages/games/src/registry.ts` — add fifteen import + registration (2 lines)
- Modify: `packages/core/src/types/plugin.ts` — add `'a-star-search'` to SolverTrace type union
- Modify: `apps/web/src/i18n/zh-CN.ts` — add fifteen namespace translations
- Modify: `apps/web/src/i18n/en.ts` — add fifteen namespace translations
- Modify: `apps/web/src/entrySetup.tsx` — add fifteen education content + viz
- Modify: `apps/web/src/workers/solver.worker.ts` — add fifteen solver branch

- [ ] **Step 1: Update SolverTrace type in core**

Edit `packages/core/src/types/plugin.ts` line 88:
Change `type: 'search-tree' | 'matrix-transform' | 'constraint-propagation' | 'nim-xor' | 'wythoff-beatty' | 'custom';`
To: `type: 'search-tree' | 'matrix-transform' | 'constraint-propagation' | 'nim-xor' | 'wythoff-beatty' | 'a-star-search' | 'custom';`

- [ ] **Step 2: Add fifteen to games registry**

Edit `packages/games/src/registry.ts`:

Add import:
```ts
import { fifteenPlugin, fifteenEntry } from './fifteen';
```

Add plugin registration (after wythoff lines):
```ts
pluginRegistry.set(fifteenPlugin.metadata.id, fifteenPlugin);
```

Add entry registration:
```ts
entryRegistry.set(fifteenEntry.plugin.metadata.id, fifteenEntry);
```

Add re-export:
```ts
export { fifteenPlugin, fifteenEntry };
```

- [ ] **Step 3: Add i18n keys to web zh-CN.ts**

Add to the `translation` object in `apps/web/src/i18n/zh-CN.ts`:
```ts
'game.fifteen.name': '15-Puzzle 数字华容道',
'game.fifteen.description': '滑动数字块重新排列——用 A* 搜索与曼哈顿距离启发式找到最短路径',
'category.search': '搜索算法',
'fifteen.empty': '空位',
'fifteen.tileAria': '数字 {{value}}，第 {{row}} 行第 {{col}} 列',
'fifteen.steps': '步数',
'fifteen.scrambleDepth': '打乱步数',
'fifteen.manhattanDist': '曼哈顿距离',
'fifteen.heuristic': '启发式',
'fifteen.fValue': 'f 值',
'fifteen.gValue': 'g 值（已走步数）',
'fifteen.hValue': 'h 值（启发式估计）',
'fifteen.solutionPath': '最优解路径',
'fifteen.searchTree': 'A* 搜索树',
'fifteen.nodesExplored': '搜索节点数',
'fifteen.solverName': 'A* (曼哈顿距离)',
```

- [ ] **Step 4: Add i18n keys to web en.ts**

Add to the `translation` object in `apps/web/src/i18n/en.ts`:
```ts
'game.fifteen.name': '15-Puzzle',
'game.fifteen.description': 'Slide numbered tiles to reorder them — use A* search with Manhattan distance heuristic to find the shortest path',
'category.search': 'Search Algorithms',
'fifteen.empty': 'Empty',
'fifteen.tileAria': 'Tile {{value}}, row {{row}} column {{col}}',
'fifteen.steps': 'Steps',
'fifteen.scrambleDepth': 'Scramble Depth',
'fifteen.manhattanDist': 'Manhattan Distance',
'fifteen.heuristic': 'Heuristic',
'fifteen.fValue': 'f-value',
'fifteen.gValue': 'g-value (cost so far)',
'fifteen.hValue': 'h-value (heuristic estimate)',
'fifteen.solutionPath': 'Solution Path',
'fifteen.searchTree': 'A* Search Tree',
'fifteen.nodesExplored': 'Nodes Explored',
'fifteen.solverName': 'A* (Manhattan Distance)',
```

- [ ] **Step 5: Add fifteen to entrySetup.tsx**

Add imports:
```ts
import { fifteenEntry } from '@ludus/games';

import l2zhFF from '@ludus/education/src/content/fifteen/l2.zh-CN.md?raw';
import l2enFF from '@ludus/education/src/content/fifteen/l2.en.md?raw';
import l3zhFF from '@ludus/education/src/content/fifteen/l3.zh-CN.md?raw';
import l3enFF from '@ludus/education/src/content/fifteen/l3.en.md?raw';
```

Add education content injection:
```ts
fifteenEntry.education = {
  content: { 'L2.zh-CN': l2zhFF, 'L2.en': l2enFF, 'L3.zh-CN': l3zhFF, 'L3.en': l3enFF },
};
```

Add visualization injection (after Wythoff block):
```ts
const FifteenTreeViz = lazy(() => import('./components/FifteenTreeViz').then(m => ({ default: m.FifteenTreeViz })));

fifteenEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'a-star-search',
  Component: (({ trace, solution, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      <FifteenTreeViz trace={trace} solution={solution} gameState={gameState as any} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};
```

- [ ] **Step 6: Add fifteen to worker**

Edit `apps/web/src/workers/solver.worker.ts`, add after the lights-out branch:
```ts
} else if (gameId === 'fifteen') {
  // Dynamic import not available in workers — solveFifteen must be imported
  // For now, the worker delegates to the main thread solver
  // TODO: extract solveFifteen to a worker-compatible module
  self.postMessage({ id, type, error: 'Fifteen worker not yet implemented — use main thread' });
```

- [ ] **Step 7: Verify build**

Run: `cd /Users/zxj/Desktop/Ludus && npx tsc --noEmit -p packages/games/tsconfig.json && npx tsc --noEmit -p apps/web/tsconfig.json`
Expected: no errors

---

### Task 11: Education content (4 markdown files)

**Files:**
- Create: `packages/education/src/content/fifteen/l2.zh-CN.md`
- Create: `packages/education/src/content/fifteen/l2.en.md`
- Create: `packages/education/src/content/fifteen/l3.zh-CN.md`
- Create: `packages/education/src/content/fifteen/l3.en.md`

- [ ] **Step 1: Write l2.zh-CN.md**

```md
## 1. 玩 · Play

滑动数字块，将它们排列成 1 到 15 的正确顺序。点击空位旁边的数字块，它就会滑入空位。

## 2. 思考 · Think

每次滑动都是一步。你能用最少的步数完成吗？有没有一种方法可以"看"出下一步该滑哪块？

## 3. 揭示 · Reveal

**15-Puzzle** 是一个经典的**状态空间搜索**问题。在 4×4 网格中：
- 状态总数 = 16! / 2 ≈ 1.04 × 10¹³（恰好一半排列可达）
- 每个状态最多有 4 种走法（上下左右）
- 最坏情况需要 **80 步**

**曼哈顿距离**是最常用的启发式：每个数字块距离它应该在的位置的"街区距离"之和。这个估计永远**不会高估**实际剩余步数（**可采纳**），因此 A* 算法使用它保证找到最短路径。

## 4. 求解器 · Solver

**A\* 算法**每次选择 `f(n) = g(n) + h(n)` 最小的节点展开：
- `g(n)`：从起点走到 n 已用的步数
- `h(n)`：曼哈顿距离 —— 从 n 到目标还需多少步的**估计**

因为曼哈顿距离是可采纳的（从不高估），A* 保证找到的路径是**最短的**。

## 5. 出题 · Create

从已解状态出发，随机滑动 N 步，保证生成的关卡一定可解。
- N 越小越简单，N 越大越难
- 点击「新关卡」可以生成不同难度的初始排列
```

- [ ] **Step 2: Write l2.en.md**

```md
## 1. Play

Slide numbered tiles to arrange them in order from 1 to 15. Click any tile adjacent to the empty space, and it slides into the gap.

## 2. Think

Each slide counts as one move. Can you solve it in the fewest possible moves? Is there a way to "see" which tile to move next?

## 3. Reveal

The **15-Puzzle** is a classic **state-space search** problem. On a 4×4 grid:
- Total states = 16! / 2 ≈ 1.04 × 10¹³ (exactly half of all permutations are reachable)
- Each state has up to 4 possible moves (up/down/left/right)
- The worst case requires **80 moves**

**Manhattan distance** is the most common heuristic: the sum of "city block distances" from each tile to its goal position. This estimate never **overestimates** the actual remaining steps (**admissible**), so A* using it is guaranteed to find the shortest path.

## 4. Solver

**A\* algorithm** expands the node with the smallest `f(n) = g(n) + h(n)`:
- `g(n)`: steps taken so far from the start
- `h(n)`: Manhattan distance — an **estimate** of how many steps remain

Because Manhattan distance is admissible (never overestimates), A* is guaranteed to find the **shortest** path.

## 5. Create

Starting from the solved state, perform N random moves. This guarantees the generated puzzle is solvable.
- Smaller N = easier; larger N = harder
- Click "New Level" to generate a scramble of a different difficulty
```

- [ ] **Step 3: Write l3.zh-CN.md** (detailed, with pseudocode)

```md
## 1. 玩 · Play

15-Puzzle 的规则简单：4×4 网格，15 个数字块加一个空位，滑动相邻块进入空位，直到排列为 1-15。

## 2. 思考 · Think

为什么有的排列永远无法还原？如何度量"还剩多少步"？A* 为什么比 BFS 快这么多？

## 3. 揭示 · Reveal

### 形式化定义

- **状态空间**：$\{0,1,\ldots,15\}$ 的排列，其中 $0$ 代表空位
- **目标状态**：$[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]$
- **合法走子**：将空位与相邻（四连通）的数字块交换
- **可解性条件**：逆序数 + 空位所在行号的奇偶性（一半排列可达）

### 复杂度

- 决策问题（从给定状态是否可达目标）：**P**（逆序数判定，$O(1)$）
- 最短路径问题：**NP-hard**（对 $n \times n$ 的推广版本）
- 4×4 实例：A* + 曼哈顿距离可在 < 1 秒内求解

### 启发式函数

**曼哈顿距离** $h(n)$：每个非零块到其目标位置的 $|dr| + |dc|$ 之和。

性质：
1. **可采纳性**（Admissible）：$h(n) \le h^*(n)$，从不高估实际代价
2. **一致性**（Consistent）：$h(n) \le c(n, n') + h(n')$，每步至多减少 1

**线性冲突**（可选增强）：如果两个块在同一行且互相阻挡，额外加 2。

## 4. 求解器 · Solver

### A* 算法

```
function AStar(start):
    openSet = MinHeap()          // 按 f = g + h 排序
    openSet.push((start, g=0, h=manhattan(start)))
    closedSet = Set()

    while openSet not empty:
        current = openSet.pop()   // 最小 f 值
        if current == goal:
            return reconstruct_path(current)

        if current in closedSet: continue
        closedSet.add(current)

        for each neighbor of current:
            if neighbor in closedSet: continue
            g' = current.g + 1
            h' = manhattan(neighbor)
            openSet.push((neighbor, g', h', parent=current))

    return NO_SOLUTION  // 不应达到（4×4 所有合法状态均可解）
```

### 正确性论证

A* 使用可采纳启发式的完备性与最优性保证来自：
1. **完备性**：曼哈顿距离 $\ge 0$，优先队列保证有限步内扩展所有节点
2. **最优性**：可采纳启发式保证第一个弹出的目标节点具有最优 g 值
3. **一致性**：保证每个节点被扩展时已找到最优 g 值（无需重新打开）

## 5. 出题 · Create

### 随机走动生成法

```
function generate(depth):
    state = GOAL
    for i in 1..depth:
        moves = legalMoves(state)
        move = random(moves)  // 避免立即撤销
        state = applyMove(state, move)
    return state
```

**保证**：所有从已解状态通过合法走子可达的状态构成整个可解空间（恰好一半排列）。

### 难度控制

- `depth` 直接控制离目标的最短距离上界
- Easy: 10-20 步，Medium: 20-40 步，Hard: 40-80 步
- 实际最优解 $\le$ depth（可能更短，因为随机走动可能绕路）
```

- [ ] **Step 4: Write l3.en.md**

```md
## 1. Play

The 15-Puzzle rules are simple: a 4×4 grid with 15 numbered tiles and one empty space. Slide adjacent tiles into the empty space to arrange them in order from 1 to 15.

## 2. Think

Why are some arrangements impossible to solve? How do we measure "how many steps remain"? Why is A* so much faster than BFS?

## 3. Reveal

### Formal Definition

- **State space**: permutations of $\{0,1,\ldots,15\}$ where $0$ = empty
- **Goal state**: $[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]$
- **Legal moves**: swap the empty space with an adjacent tile (4-neighborhood)
- **Solvability**: parity of inversions + row of empty space determines reachability

### Complexity

- Decision problem (is a state reachable?): **P** (inversion count, $O(1)$)
- Shortest path: **NP-hard** (for the generalized $n \times n$ version)
- 4×4 instance: A* + Manhattan distance solves in < 1 second

### Heuristic Function

**Manhattan distance** $h(n)$: sum of $|dr| + |dc|$ for each tile to its goal position.

Properties:
1. **Admissible**: $h(n) \le h^*(n)$, never overestimates
2. **Consistent**: $h(n) \le c(n, n') + h(n')$, decreases by at most 1 per move

**Linear conflict** (optional enhancement): if two tiles block each other in the same row, add 2.

## 4. Solver

### A* Algorithm

```
function AStar(start):
    openSet = MinHeap()          // ordered by f = g + h
    openSet.push((start, g=0, h=manhattan(start)))
    closedSet = Set()

    while openSet not empty:
        current = openSet.pop()   // minimum f-value
        if current == goal:
            return reconstruct_path(current)

        if current in closedSet: continue
        closedSet.add(current)

        for each neighbor of current:
            if neighbor in closedSet: continue
            g' = current.g + 1
            h' = manhattan(neighbor)
            openSet.push((neighbor, g', h', parent=current))

    return NO_SOLUTION  // should not happen (all legal 4×4 states are solvable)
```

### Correctness

A* with admissible heuristic guarantees:
1. **Completeness**: Manhattan distance $\ge 0$, priority queue guarantees termination
2. **Optimality**: admissible heuristic guarantees the first popped goal has optimal g
3. **Consistency**: guarantees each node is expanded with optimal g (no reopening needed)

## 5. Create

### Random Walk Generation

```
function generate(depth):
    state = GOAL
    for i in 1..depth:
        moves = legalMoves(state)
        move = random(moves)  // avoid immediate reversal
        state = applyMove(state, move)
    return state
```

**Guarantee**: all states reachable from the goal via legal moves form the entire solvable space (exactly half of all permutations).

### Difficulty Control

- `depth` directly bounds the distance to the goal
- Easy: 10-20 moves, Medium: 20-40 moves, Hard: 40-80 moves
- Actual optimal solution $\le$ depth (random walk may take detours)
```

---

### Task 12: FifteenTreeViz — A* search visualization

**Files:**
- Create: `apps/web/src/components/FifteenTreeViz.tsx`

**Interfaces:**
- Consumes: `SolverTrace`, `Solution`, `GameState` from core; `FifteenState` from games

- [ ] **Step 1: Write FifteenTreeViz.tsx**

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SolverTrace, Solution, GameState } from '@ludus/core';
import type { FifteenState } from '@ludus/games';

interface Props {
  trace: SolverTrace;
  solution: Solution;
  gameState: FifteenState;
}

interface PathNode {
  grid: number[];
  g: number;
  h: number;
  f: number;
  step: number;
}

export function FifteenTreeViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const data = trace.visualizationData as {
    nodesExplored: number;
    solutionLength: number;
    pathNodes: PathNode[];
    timeMs: number;
  } | undefined;

  const pathNodes = data?.pathNodes || [];
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const solutionLength = data?.solutionLength ?? solution.stats.solutionLength;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;

  return (
    <div className="p-4 bg-warm-stone-50 rounded-card border border-warm-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-warm-stone-800">{t('fifteen.searchTree')}</h3>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-logic-indigo-600 hover:text-logic-indigo-800 font-medium"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('fifteen.nodesExplored')}: {nodesExplored.toLocaleString()}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('fifteen.solutionPath')}: {solutionLength} steps
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {timeMs}ms
        </div>
      </div>

      {/* Solution path SVG */}
      <AnimatePresence>
        {expanded && pathNodes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="text-xs text-warm-stone-500 mb-3 font-medium">
              Each node shows: step number, g (cost so far), h (heuristic), f = g + h
            </div>

            {/* Grid thumbnails */}
            <div className="flex flex-wrap gap-4 justify-center">
              {pathNodes.map((node, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`grid gap-0.5 p-1 rounded-lg ${
                      i === pathNodes.length - 1
                        ? 'bg-game-amber-100 ring-2 ring-game-amber-400'
                        : 'bg-warm-stone-100'
                    }`}
                    style={{ gridTemplateColumns: 'repeat(4, 1fr)', width: 'fit-content' }}
                  >
                    {node.grid.map((val, idx) => (
                      <div
                        key={idx}
                        className={`
                          w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold
                          ${val === 0 ? 'bg-transparent' : 'bg-logic-indigo-500 text-white'}
                        `}
                      >
                        {val !== 0 ? val : ''}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-warm-stone-600 text-center">
                    <div>g={node.g} h={node.h}</div>
                    <div className="font-bold text-logic-indigo-700">f={node.f}</div>
                  </div>
                  {i < pathNodes.length - 1 && (
                    <div className="text-warm-stone-400 text-xs">↓</div>
                  )}
                </div>
              ))}
            </div>

            {/* f-value trend */}
            <div className="mt-4">
              <div className="text-xs text-warm-stone-500 mb-2 font-medium">f = g + h trend (non-decreasing along optimal path)</div>
              <div className="flex items-end gap-0.5 h-16">
                {pathNodes.map((node, i) => {
                  const maxF = pathNodes[pathNodes.length - 1]!.f || 1;
                  const heightPct = (node.f / maxF) * 100;
                  const isLast = i === pathNodes.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className={`w-full rounded-t-sm min-h-[2px] ${
                          isLast ? 'bg-game-amber-400' : 'bg-logic-indigo-300'
                        }`}
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-warm-stone-400 mt-1">
                <span>Step 0</span>
                <span>Step {pathNodes.length - 1}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### Task 13: Integration & final verification

- [ ] **Step 1: Run all tests**

Run: `cd /Users/zxj/Desktop/Ludus && npx vitest run`
Expected: all ~227 tests passing (199 existing + ~28 fifteen)

- [ ] **Step 2: Full typecheck**

Run: `cd /Users/zxj/Desktop/Ludus && npx tsc --noEmit -p packages/core/tsconfig.json && npx tsc --noEmit -p packages/games/tsconfig.json && npx tsc --noEmit -p apps/web/tsconfig.json`
Expected: zero errors

- [ ] **Step 3: Build**

Run: `cd /Users/zxj/Desktop/Ludus && npm run build`
Expected: successful build

- [ ] **Step 4: Manual verification**

Start dev server: `cd /Users/zxj/Desktop/Ludus && npm run dev`
- Open Hub page: verify "15-Puzzle" card appears with 🧩 icon
- Click card: verify game loads, board renders with 4×4 grid
- Click adjacent tiles: verify sliding animation works
- Use arrow keys: verify keyboard controls
- Click "New Level": verify new scramble generated
- Click "Solve": verify A* finds solution, playback works
- Click "Hint": verify hint tile is highlighted
- Open education panel (L2/L3): verify content renders
- Open A* search tree viz: verify path nodes shown
- Switch language: verify all text translates
- Mobile viewport: verify board is responsive

- [ ] **Step 5: Commit**

```bash
git add packages/games/src/fifteen/ packages/games/src/registry.ts packages/core/src/types/plugin.ts apps/web/src/i18n/zh-CN.ts apps/web/src/i18n/en.ts apps/web/src/entrySetup.tsx apps/web/src/components/FifteenTreeViz.tsx apps/web/src/workers/solver.worker.ts packages/education/src/content/fifteen/
git commit -m "feat: add 15-puzzle game with A* solver and search tree visualization"
```
