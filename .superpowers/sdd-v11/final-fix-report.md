# Thief Siege v1.1 Final Fix Report

- Fixed generator ordering: irregular open maps are attempted before constructive corridor fallback.
- Added bottleneck-biased irregular maps that preserve open area while keeping easy proofs fast.
- Wired sync plugin AI to BFS-only movement; async/worker AI remains adversary-backed.
- Wired visible AI tier labels from `escape-adversary/<tier>` stats in the thief-siege status card.
- Added regression coverage for open-cell floors, sync BFS AI, and tier-label parsing.
- Verification: `pnpm --filter @ludus/games exec vitest run src/thief-siege/` passed; `pnpm typecheck` passed.
- Open-cell evidence for seed 3: easy 11x11 = 58 open cells, mid 15x15 = 116, hard 19x19 = 202.
