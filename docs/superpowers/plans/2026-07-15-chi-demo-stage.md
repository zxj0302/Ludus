# CHI Demo Stage Layout Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** `/demo` uses left board + right live-viz stage on `solve`/`reveal`; no EducationPanel sidebar in demo.

**Architecture:** `GameShell variant="demo"` hides education/generator chrome. `DemoVizPane` mounts game visualization + short steps. `DemoPage` split layout; Stage R open iff beat is solve/reveal. Pure helper for Skip-to-viz.

**Tech Stack:** React, Zustand, existing `@ludus/games` visualization entries, vitest.

**Spec:** `docs/superpowers/specs/2026-07-15-chi-demo-stage-design.md`

## Global Constraints

- Only `/demo`; no GameShell default sidebar regression
- No playlist schema change
- No Markdown teaching in Demo
- Stage R fully collapsed on speak/play/hint
- i18n for all user strings

---

### Task 1: Skip-to-viz helper + tests

**Files:** `apps/web/src/demo/demoNavigation.ts`, `demoNavigation.test.ts`

- [ ] Add `findVizBeatIndex(beats)` → first `solve` else first `reveal` else null
- [ ] Tests for solve-first, reveal-only, none

### Task 2: GameShell `variant="demo"`

**Files:** `apps/web/src/components/GameShell.tsx`

- [ ] `variant?: 'default' | 'demo'`
- [ ] demo: no education toggle, no EducationPanel, no newLevelSlot / GeneratorToolbar
- [ ] tighten outer padding when nested in DemoPage (`className` compact)

### Task 3: DemoVizPane

**Files:** `apps/web/src/demo/DemoVizPane.tsx` (new)

- [ ] Title + optional Hub link
- [ ] StatusCard via `entry.ui.statusCard` when present
- [ ] `entry.visualization` when matchTrace
- [ ] Short move list (max 8 + “…” )
- [ ] Empty / solving states via i18n

### Task 4: DemoPage stage layout + side effects

**Files:** `apps/web/src/demo/DemoPage.tsx`, i18n en/zh-CN

- [ ] Remove educationOpen / preferViz side effects; keep hint/solve requests; setDisclosureLevel(2) on solve still OK for fast solver solution if needed
- [ ] Split layout; Stage R when solve|reveal
- [ ] Skip to viz button
- [ ] Narration tweaks for right panel
- [ ] Update spec status + PROGRESS

### Task 5: Verify

- [ ] `vitest` demo tests
- [ ] typecheck web if quick
