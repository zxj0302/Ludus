# Peg Solitaire Task 5 Report

## Summary

Implemented Task 5 for Peg Solitaire:

- Added rich L2/L3 education content in zh-CN and en under `packages/education/src/content/peg-solitaire/`.
- Added `apps/web/src/components/PegSearchViz.tsx`.
- Wired raw markdown, peg-only `search-tree` visualization, and `GeneratorToolbar` in `apps/web/src/entrySetup.tsx`.
- Added developer documentation at `docs/games/peg-solitaire.md`.
- Added ADR-025 to `docs/DECISIONS.md` and updated `docs/PROGRESS.md`.

## Education Hooks Intentionally Placed

- L2 Hook: “最后三步经常不是收尾，而是审判” / “the last three moves are a trial” to make dead-end endgames memorable.
- L2 Hook: “见洞就跳” as the bad greedy habit that creates isolated pegs.
- L2 Hook: “33-bit password” to connect the friendly board to bitmask state.
- L3 Hook: “garbage collection without undo” to explain irreversibility.
- L3 Hook: “D4 symmetry recognizes eight selfies as the same person” to make orbit reduction intuitive.
- L3 Hook: “health certificate, not a Michelin star” to explain generator guarantees without overstating uniqueness.

## Rigorous Claims Intentionally Placed

- Every legal move reduces peg count by exactly one, so any route from \(n\) pegs to \(k\) pegs has \(n-k\) moves.
- Legal moves are fixed orthogonal `from-over-to` triples; diagonal and long jumps are not legal.
- The naive state-space upper bound is \(2^{33}=8,589,934,592\), while reachable states are a smaller subset.
- The legal-move graph is acyclic because `popcount` strictly decreases on every edge.
- `canonicalKey` is invariant on D4 orbits because all eight transformed masks share the same minimum representative.
- BFS proves shortest paths under unit move costs; DFS finds feasible routes but is not a shortest-proof certificate.
- Worker execution changes thread placement, not solver semantics.
- `uniqueSolution: false` is intentional because v1 verifies reachability, not unique solution or unique shortestness.

## Verification

- `pnpm test:run`: passed — 61 test files passed, 1 skipped; 503 tests passed, 3 skipped.
- `pnpm typecheck`: passed — all workspace package typechecks completed.

## Notes

ADR-025 records the decision to reuse `search-tree` and render an honest evidence panel instead of adding a peg-specific trace type before full parent/child tree data exists.
