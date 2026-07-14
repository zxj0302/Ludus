# Task 4 Report: Worker + async adversarial AI

## Status

Completed.

## Changes

- Extended `GamePlugin.ai` with optional `getAIMoveAsync`.
- Extended Worker messages with `ai-move` and `AiMoveTaskPayload`.
- Wired Thief Siege solver to prefer adversarial search and degrade to BFS, with `escape-adversary/<tier>` stats.
- Added Thief Siege Worker handlers for `solve` and `ai-move` using direct source imports.
- Updated web `scheduleAI` to use an immediate async path for Worker/async AI while preserving the 600ms sync path for Nim/Wythoff.
- Enabled Thief Siege web Worker capability and added AI thinking/tier i18n keys.

## Verification

- `pnpm --filter @ludus/games exec vitest run src/thief-siege/` passed: 5 files, 49 tests.
- `pnpm typecheck` passed across workspace packages.
- ReadLints reported no diagnostics on edited files.

## Concerns

- No full thinking-status UI was added; Task 4 brief marked that as optional/out of scope.
- Worker AI currently applies only when the original state object is still current, so stale results are discarded.

## Follow-up Review Fix

- Added regression coverage for `chooseThiefStep` adjacent-exit behavior under an adversary budget, BFS fallback when adversary search returns no step, and the shared Thief Siege `ai-move` `{ move, tier, delay }` contract.
- Centralized Thief Siege async AI move composition in `chooseThiefSiegeAiMove`, reused by the plugin and Worker handler.
- Raised the async AI post-worker delay cap from 50ms to 400ms so returned delays remain meaningful without restoring the global 600ms adversarial delay.
- Verified `pnpm --filter @ludus/games exec vitest run src/thief-siege/` and `pnpm typecheck`.
