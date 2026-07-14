# Peg Solitaire Developer Notes

## Identity

- **Game id**: `peg-solitaire`
- **Display name**: `game.pegSolitaire.name` / 孔明棋
- **Category**: search
- **Render backend**: DOM
- **Trace type**: `search-tree`
- **Board**: English 33-hole cross board

## Rules Summary

Peg Solitaire is a single-player jump-capture puzzle. A legal move chooses `from-over-to` on one orthogonal three-hole line: `from` and `over` must contain pegs, and `to` must be empty. Applying the move clears `from` and `over`, fills `to`, and therefore reduces the peg count by exactly one.

The shipped goals are:

- `le3`: win with at most 3 pegs.
- `one-any`: win with exactly 1 peg anywhere.
- `one-center`: win with exactly 1 peg at `CENTER_HOLE`.

## Module Map

- `packages/games/src/peg-solitaire/types.ts`: state, move, and goal types.
- `packages/games/src/peg-solitaire/geometry.ts`: English-board coordinates, jump triples, `CENTER_HOLE`, and D4 permutations.
- `packages/games/src/peg-solitaire/rules.ts`: legal moves, move application, terminal normalization, and state guard.
- `packages/games/src/peg-solitaire/solver.ts`: BFS/DFS search with D4 canonical keys and `search-tree` trace output.
- `packages/games/src/peg-solitaire/puzzles.ts`: classic center-empty start and curated micro/endgame puzzles.
- `packages/games/src/peg-solitaire/generator.ts`: difficulty-range target selection, curated sampling, light dig-out, and solver verification.
- `packages/games/src/peg-solitaire/difficulty.ts`: heuristic score from peg load, mobility, target strictness, and center occupancy.
- `packages/games/src/peg-solitaire/render.tsx`: playable DOM board.
- `packages/games/src/peg-solitaire/education-ui.tsx`: status card and move formatting.
- `packages/games/src/peg-solitaire/manifest.ts`: education and visualization manifests.
- `packages/games/src/peg-solitaire/i18n.ts`: game-specific zh-CN/en strings.
- `packages/games/src/peg-solitaire/index.tsx`: `GamePlugin` and `GamePluginEntry`.
- `packages/education/src/content/peg-solitaire/`: L2/L3 education content in zh-CN/en.
- `apps/web/src/components/PegSearchViz.tsx`: web-only search evidence visualization for `search-tree` traces.
- `apps/web/src/entrySetup.tsx`: raw markdown injection, lazy viz registration, and `GeneratorToolbar` wiring.
- `apps/web/src/workers/solver.worker.ts`: web Worker route for peg solve requests.

## Solver Notes

`solvePegSolitaire()` emits a standard `Solution`:

- `trace.type = 'search-tree'`
- `trace.visualizationData.nodesExplored`
- `trace.visualizationData.solutionLength`
- `trace.visualizationData.maxDepth`
- `trace.visualizationData.terminated = solved|timeout|exhausted`
- `trace.visualizationData.symmetry = 'D4'`
- `trace.visualizationData.search = 'bfs'|'dfs'`
- `trace.visualizationData.path = PegSolitaireMove[]`

The solver uses `canonicalKey(pegs)` to collapse D4-equivalent positions. Small endgames and explicit `findShortest` use BFS; deeper default solves use DFS with the same canonical visited set. BFS can certify shortest length for unit-cost jumps; DFS only returns a feasible route within the budget and must not be described as an optimality proof.

## Generator Notes

`generatePegSolitaireLevel()` maps `difficultyRange` to a goal:

- `1..33` -> `le3`
- `34..66` -> `one-any`
- `67..100` -> `one-center`

It samples curated puzzles for the target, optionally applies light dig-out variation, then runs `solvePegSolitaire(..., { findShortest: true, timeMs: 1000 })` to verify reachability. Returned levels set `uniqueSolution: false`; v1 guarantees a reachable target, not uniqueness or unique shortestness.

## Education and Visualization

The education files intentionally mark hooks and rigorous claims so review can audit the spec §7 quality bar. L3 covers bitmask representation, D4 orbit canonicalization, BFS/DFS trade-offs, complexity honesty, Worker behavior, generator verification, and the contrast with Lights Out's GF(2) algebraic solver.

`PegSearchViz` is an evidence panel rather than a full tree renderer. It shows search statistics, termination status, symmetry/search mode, and the first returned path moves. This keeps the visualization truthful when a result is DFS-derived, timed out, or not unique.

## Extension Points

- **Full React Flow tree**: replace or augment `PegSearchViz` once solver traces include parent/child node samples.
- **Unique shortest generation**: count target routes at the shortest depth before setting `uniqueSolution`.
- **Other boards**: add a separate geometry module for French 37-hole or triangular variants instead of overloading the English board constants.
- **Stronger heuristics**: add center-distance, dead-end density, and symmetry-breaking metrics to difficulty scoring after playtest data exists.
