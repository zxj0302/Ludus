# Peg Solitaire Developer Notes

## Identity

- **Game id**: `peg-solitaire`
- **Category**: search
- **Trace / viz**: `search-tree` + React Flow sampled tree (`PegSearchViz`: indigo knowledge-card shell, principal variation + capped side branches)
- **Solver**: shallow BFS+D4 / deep DFS+D4 (not BFS-only); singleton goals have fixed length $n-1$
- **Hub first load**: `seed: 0` → classic center-vacant (ADR-026); `level.optimalSteps` seeds top-bar optimal
- **Background solve**: always runs for Live Analysis `search-tree` viz; catalog `optimalSteps` are preserved on timeout
- **Board**: English 33-hole cross
- **Levels**: classic catalog only (`generatedBy: 'classic-catalog'`)
- **Toolbar**: Sokoban-style mode + named level (`PegSolitaireToolbar`) — **no** Hub difficulty selector

## Play Goals / Modes (v1.2)

| Mode (UI) | Goal | Win condition |
|-----------|------|----------------|
| 剩一 / Leave one | `one-any` | exactly one peg anywhere |
| 中心剩一 / Center one | `one-center` | exactly one peg at `CENTER_HOLE` |

`le3` is **not** a playable goal (education footnote only).

## Catalog

Defined in `packages/games/src/peg-solitaire/puzzles.ts` as `PEG_CATALOG`.

Each entry: `id`, `titleKey`, `source`, `pegs`, `goal`, optional legacy `tier`, `knownSolutionLength`.

Browse API: `catalogByGoal(goal)` (one-center lists classic first).

Classic center-vacant stores **single-jump** length 31 (not Bergholt’s 18 multi-jump count).

Hole labels in UI/education: English algebraic **a–g × 1–7**, center **d4**.

`generatePegSolitaireLevel` is Hub fallback only (one-center shelf; seed 0 → classic). Primary UX loads via `loadCustomState` from the toolbar.

## Module Map

- `types.ts` / `geometry.ts` / `rules.ts` / `solver.ts`
- `puzzles.ts` — catalog
- `generator.ts` — Hub fallback catalog picker
- `difficulty.ts` — score metadata (not for Hub tier UI)
- `render.tsx` / `education-ui.tsx` / `i18n.ts` / `index.tsx`
- Web: `apps/web/src/components/PegSolitaireToolbar.tsx`
- Education: `packages/education/src/content/peg-solitaire/`
- Viz: `apps/web/src/components/PegSearchViz.tsx`

## Spec / ADR

- Spec: `docs/superpowers/specs/2026-07-14-peg-solitaire-catalog-design.md` (v1.2 UX)
- ADR-025: React Flow sampled search tree (PV + branches); dig-out superseded by ADR-026
- ADR-026: classic catalog selection (no procedural generation; v1.2 = mode+level UX)
