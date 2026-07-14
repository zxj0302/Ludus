# Peg Solitaire v1.1 Catalog Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Replace dig/le3 gameplay with a classic English-board catalog picker (方案 A), matching Sokoban-style curated levels.

**Architecture:** `catalog.ts` holds named puzzles; `generator.ts` only selects by Hub tier + seed; rules/goals drop `le3`; education explains `one-any` vs `one-center`.

**Tech Stack:** Existing `@ludus/games` plugin, Vitest, i18n, React board/viz unchanged in role.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-14-peg-solitaire-catalog-design.md` exactly.
- No dig / reverse-synthesis generation.
- Play goals: only `one-any` | `one-center`.
- Catalog minima: easy≥4, medium≥3, hard≥3 (incl. classic).
- Every catalog entry solver-verified for its goal (classic may use known length 31 without live full solve in generate).
- UI/i18n style consistent with other Ludus games (no hardcoded user strings).
- `generatedBy: 'classic-catalog'` (or `'classic set'`-like).

---

## Task 1: Types + rules drop `le3`

- Update `types.ts`, `rules.ts`, tests; `meetsGoal` only two goals.

## Task 2: Catalog + picker generator

- Replace dig generator with catalog select by tier (Sokoban pattern).
- Verify non-classic entries with BFS; classic hard entry with known length.

## Task 3: Difficulty, plugin, i18n, board copy

- Score per §6; remove le3 i18n goals; optional level title in status if fits style.

## Task 4: Education + docs + ADR

- Update 4 education md files; `docs/games/peg-solitaire.md`; ADR-026; mark catalog spec confirmed; PROGRESS.

## Task 5: Full test pass

- `pnpm --filter @ludus/games exec vitest run src/peg-solitaire/`
- Fix any fallout.
