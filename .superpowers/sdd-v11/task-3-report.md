# Task 3 Report: Hybrid Cop-Win Generation Gates

## Status

Implemented Task 3 for thief-siege v1.1.

## TDD Evidence

- RED: `pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts src/thief-siege/adversary.test.ts`
  - Failed as expected: easy generated levels were not proven cop-winning; mid/hard seed had shallow thief-win evidence.
- GREEN: same command passed after implementation.

## Changes

- Added generator tests for:
  - easy levels proving `copHasWinningStrategy(...) === true` for seeds 1-5.
  - mid/hard openings preserving an escape path, starting in cop phase, and passing a shallow adversary check.
- Added `passesWinGate` in `packages/games/src/thief-siege/generator.ts`.
  - All tiers require an opening escape path.
  - Easy tiers require strict `copHasWinningStrategy` under the requested proof budget.
  - Mid/hard tiers require path-place capacity and shallow adversary screening.
- Added seeded constructive bottleneck candidates and a fallback state.
  - The bottleneck construction keeps proofs fast by ensuring the cop can seal the only route from thief to exit.

## Verification

```bash
pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts src/thief-siege/adversary.test.ts
```

Result: 2 files passed, 14 tests passed. Vitest reported 715ms total duration.

## Concerns

- The constructive candidate currently dominates generation, producing intentionally narrow bottleneck maps. This satisfies Task 3 gates and keeps easy proofs fast; later polish may want more visual variety while preserving the same gates.

## Review Caveat Fix

- RED: `pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts` failed when the easy win gate was mocked closed; generator returned an ungated fallback instead of throwing.
- Fix: `createFallbackState` now returns only candidates passing `passesWinGate(state, targetScore)`, tries alternate sealed templates, then throws a clear fallback win-gate error.
- GREEN: `pnpm --filter @ludus/games exec vitest run src/thief-siege/generator.test.ts` passed with 1 file / 11 tests.
