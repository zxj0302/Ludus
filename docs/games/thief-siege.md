# Thief Siege Developer Notes

## Identity

- **Game id**: `thief-siege`
- **Display name**: `game.thiefSiege.name` / 围堵小偷
- **Category**: graph theory
- **Render backend**: DOM
- **Trace type**: `escape-path`

## Rules Summary

The player controls cops. On each cop turn, the player places one cop on a walkable unoccupied cell. The thief then takes one AI step. If the thief steps onto an `exit` cell, the thief wins; if the thief has no legal step during its turn, the cops win.

The board is a rectangular row-major grid with three cell kinds:

- `floor`: normal walkable cell
- `exit`: walkable edge target for the thief
- `obstacle`: non-playable cell or wall

## Module Map

- `packages/games/src/thief-siege/types.ts`: state and move types.
- `packages/games/src/thief-siege/rules.ts`: legal moves, `applyMove`, terminal normalization, state guard.
- `packages/games/src/thief-siege/solver.ts`: escape BFS, thief AI step, cop placement suggestion.
- `packages/games/src/thief-siege/generator.ts`: irregular-mask level generation with BFS validation.
- `packages/games/src/thief-siege/difficulty.ts`: score from board size, cop budget, openness, and route pressure.
- `packages/games/src/thief-siege/render.tsx`: playable DOM board.
- `packages/games/src/thief-siege/education-ui.tsx`: education status card and move labels.
- `packages/games/src/thief-siege/manifest.ts`: education and visualization manifests.
- `packages/games/src/thief-siege/i18n.ts`: game-specific zh-CN/en strings.
- `packages/games/src/thief-siege/index.tsx`: `GamePlugin` and `GamePluginEntry` registration.
- `packages/education/src/content/thief-siege/`: L2/L3 education content in zh-CN/en.
- `apps/web/src/components/EscapePathViz.tsx`: web-only path visualization for `escape-path` traces.

## Solver and AI

`solveThiefSiege()` normalizes the state, runs BFS from the thief to the nearest exit, and emits:

- `trace.type = 'escape-path'`
- `trace.visualizationData.escapePath = { row, col }[]`
- one recommended move when available

During cop phase, the recommendation tries to block a legal cell on the current shortest escape path. During thief phase, `chooseThiefStep()` prefers an immediate exit, then the next cell along the shortest escape path, then any step preserving reachability, and finally the highest-degree fallback.

This is intentionally explainable escape-path logic, not a full minimax pursuit-evasion solver.

## Generator Notes

`generateThiefSiegeLevel()` uses a seeded PRNG from `generator-config`:

1. Pick size 7, 9, or 11 from the difficulty range.
2. Build an irregular playable mask from a perturbed ellipse.
3. Mark playable boundary cells as exits.
4. Add interior obstacles outside a protected center area.
5. Place the thief near the center.
6. Reject candidates without an initial BFS escape path.

Returned levels set `uniqueSolution: false` and `optimalSteps: null` because no global optimal cop strategy is computed.

## Entry Wiring

`apps/web/src/entrySetup.tsx` injects Vite raw markdown into `thiefSiegeEntry.education.content`, registers `EscapePathViz` for `escape-path`, and attaches the shared `GeneratorToolbar`.

The plugin itself remains framework-independent except for its render and entry layer, following ADR-023's self-contained game module pattern.

## Extension Points

- **Hex topology**: add a separate neighbor function and board renderer variant; do not overload the current square-grid rules without a migration plan.
- **Stronger cop strategy**: add finite-horizon minimax or AND-OR search behind a new trace type so the current BFS teaching path remains stable.
- **Angel and Devil**: keep as a separate game/module. It has different theory and should not be folded into `thief-siege`.
