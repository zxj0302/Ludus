# Thief Siege Developer Notes

## Identity

- **Game id**: `thief-siege`
- **Display name**: `game.thiefSiege.name` / 围堵小偷
- **Category**: graph theory
- **Render backend**: DOM
- **Trace type**: `escape-path`

## Rules Summary

The player controls cops. On each cop turn, the player places one cop on a walkable unoccupied cell. The thief then takes one AI step chosen by the adversarial engine when possible. If the thief steps onto an `exit` cell, the thief wins; if the thief has no legal step during its turn, the cops win.

The board is a rectangular row-major grid with three cell kinds:

- `floor`: normal walkable cell
- `exit`: walkable edge target for the thief
- `obstacle`: non-playable cell or wall

## Module Map

- `packages/games/src/thief-siege/types.ts`: state and move types.
- `packages/games/src/thief-siege/rules.ts`: legal moves, `applyMove`, terminal normalization, state guard.
- `packages/games/src/thief-siege/adversary.ts`: bounded minimax / alpha-beta search, evaluation, AI tier result, `copHasWinningStrategy`.
- `packages/games/src/thief-siege/solver.ts`: escape BFS, adversarial thief AI wrapper, cop placement suggestion, `escape-adversary/<tier>` stats.
- `packages/games/src/thief-siege/generator.ts`: 11/15/19 irregular or constructive generation with hybrid win gates.
- `packages/games/src/thief-siege/difficulty.ts`: score from board size, cop budget, openness, and route pressure.
- `packages/games/src/thief-siege/render.tsx`: playable DOM board.
- `packages/games/src/thief-siege/education-ui.tsx`: education status card and move labels.
- `packages/games/src/thief-siege/manifest.ts`: education and visualization manifests.
- `packages/games/src/thief-siege/i18n.ts`: game-specific zh-CN/en strings.
- `packages/games/src/thief-siege/index.tsx`: `GamePlugin` and `GamePluginEntry` registration.
- `packages/education/src/content/thief-siege/`: L2/L3 education content in zh-CN/en.
- `apps/web/src/components/EscapePathViz.tsx`: web-only path visualization for `escape-path` traces.
- `apps/web/src/workers/solver.worker.ts`: web Worker handling for `solve` and `ai-move` tasks.
- `apps/web/src/stores/gameStoreSolverRuntime.ts`: async AI scheduling and Worker fallback.

## Solver and AI

`solveThiefSiege()` normalizes the state, runs BFS from the thief to the nearest exit for visualization, then asks the adversarial engine for the recommended move when possible. It emits:

- `trace.type = 'escape-path'`
- `trace.visualizationData.escapePath = { row, col }[]`
- one recommended move when available
- `stats.solverName = escape-adversary/perfect|bounded|bfs`

During cop phase, `searchAdversary()` evaluates legal `place` moves and minimizes the thief's score. During thief phase, `chooseThiefSiegeAiMove()` evaluates legal `step` moves and maximizes the thief's score. If adversarial search cannot produce a legal step within budget, the game falls back to the old BFS policy: immediate exit, shortest-path next step, any reachability-preserving step, then highest-degree fallback.

Budgets are size-sensitive: 11×11 gets the widest search and may report `perfect`; 15×15 and 19×19 use bounded depth/time budgets and may report `bounded`. The `escape-path` visualization remains BFS-based so the player can still see the concrete route being cut.

On web, the plugin advertises `webWorker: true` and `gameStoreSolverRuntime` sends `ai-move` tasks to `solver.worker.ts` for `thief-siege`. Desktop/mobile currently use the pure TS fallback path when the web Worker route is unavailable.

## Generator Notes

`generateThiefSiegeLevel()` uses a seeded PRNG from `generator-config`:

1. Pick size 11, 15, or 19 from the difficulty range, or clamp `config.size` to that set.
2. Prefer a constructive bottleneck candidate, then try an irregular playable mask from a perturbed ellipse.
3. Mark playable boundary cells as exits.
4. Add interior obstacles outside a protected center area.
5. Place the thief near the center.
6. Reject candidates without an initial BFS escape path.
7. Apply the hybrid win gate:
   - easy 11×11: require `copHasWinningStrategy(...) === true` under a generous proof budget.
   - medium/hard: require enough placeable cells on the escape path and pass a shallow `searchAdversary` check.

Returned levels set `uniqueSolution: false` and `optimalSteps: null` because no global optimal cop strategy is computed.

## Entry Wiring

`apps/web/src/entrySetup.tsx` injects Vite raw markdown into `thiefSiegeEntry.education.content`, registers `EscapePathViz` for `escape-path`, and attaches the shared `GeneratorToolbar`.

The plugin itself remains framework-independent except for its render and entry layer, following ADR-023's self-contained game module pattern.

## Extension Points

- **Hex topology**: add a separate neighbor function and board renderer variant; do not overload the current square-grid rules without a migration plan.
- **Stronger cop strategy**: deepen the existing adversarial engine or add AND-OR proof traces behind a new trace type so the current BFS teaching path remains stable.
- **Angel and Devil**: keep as a separate game/module. It has different theory and should not be folded into `thief-siege`.
