# Create Panel Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight generator control to the EducationPanel Create section so users can pick a difficulty preset and immediately generate a playable level.

**Architecture:** Keep the feature inside the web presentation layer. `EducationPanel` will detect the `create` section and render a small `CreateLevelControl` above the existing Markdown body. The control reuses `@ludus/ui` `DifficultySelector` and existing `useGameStore` actions, so no plugin interface changes are needed.

**Tech Stack:** React 18, Zustand store (`useGameStore`), `@ludus/ui` `DifficultySelector`, Vitest.

## Global Constraints

- Do not extend `GamePlugin` or `GamePluginEntry`.
- Do not add per-game advanced parameter forms.
- Do not modify education Markdown structure.
- Do not support user-written code, scripts, or custom plugins in this task.
- Keep all user-facing text i18n-backed through existing `generator.*` / `game.toolbar.*` keys.

---

## File Structure

- Modify `apps/web/src/components/EducationPanel.tsx`: add `CreateLevelControl`, pass a flag into `SectionCard`, render control only for `section.key === 'create'`.
- Create `apps/web/src/components/educationSections.test.ts`: test the section helper marks Create sections as generator-capable.
- Modify `docs/PROGRESS.md`: record stage 6c Create-section generator control completion and next action.

### Task 1: Extract Section View Model Test

**Files:**
- Create: `apps/web/src/components/educationSections.test.ts`
- Modify: `apps/web/src/components/EducationPanel.tsx`

**Interfaces:**
- Produces: `export function getSectionViewModel(section: { key: string }): { showCreateLevelControl: boolean }`
- Consumes: Existing `section.key` from `splitSections()`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/educationSections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getSectionViewModel } from './EducationPanel';

describe('getSectionViewModel', () => {
  it('marks only the Create education section as generator-capable', () => {
    expect(getSectionViewModel({ key: 'create' }).showCreateLevelControl).toBe(true);
    expect(getSectionViewModel({ key: 'solve' }).showCreateLevelControl).toBe(false);
    expect(getSectionViewModel({ key: 'play' }).showCreateLevelControl).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter ludus-web exec vitest run src/components/educationSections.test.ts`

Expected: FAIL because `getSectionViewModel` is not exported.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/src/components/EducationPanel.tsx`, add near `splitSections()`:

```ts
export function getSectionViewModel(section: { key: string }): { showCreateLevelControl: boolean } {
  return { showCreateLevelControl: section.key === 'create' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter ludus-web exec vitest run src/components/educationSections.test.ts`

Expected: PASS, 1 test.

### Task 2: Render CreateLevelControl In Create Section

**Files:**
- Modify: `apps/web/src/components/EducationPanel.tsx`

**Interfaces:**
- Consumes: `DifficultySelector` from `@ludus/ui`.
- Consumes: `useGameStore(s => s.difficultyRange)`, `setDifficultyRange`, `newLevel`.
- Consumes: `getSectionViewModel(section)`.
- Produces: Visible generator control only inside the Create section.

- [ ] **Step 1: Import `DifficultySelector`**

Change the existing UI import:

```ts
import { DifficultySelector, MarkdownRenderer } from '@ludus/ui';
```

- [ ] **Step 2: Add `CreateLevelControl`**

Add above `SectionCard`:

```tsx
function CreateLevelControl() {
  const difficultyRange = useGameStore(s => s.difficultyRange);
  const setDifficultyRange = useGameStore(s => s.setDifficultyRange);
  const newLevel = useGameStore(s => s.newLevel);

  const handlePresetChange = useCallback(
    (range: [number, number]) => {
      setDifficultyRange(range);
      newLevel();
    },
    [setDifficultyRange, newLevel],
  );

  return (
    <div className="mb-3 rounded-card border border-violet-200 bg-violet-50 px-3 py-3">
      <DifficultySelector
        value={difficultyRange}
        onPresetChange={handlePresetChange}
        onGenerate={newLevel}
      />
    </div>
  );
}
```

- [ ] **Step 3: Render the control in `SectionCard`**

Inside `SectionCard`, after `const title = ...`, add:

```ts
const viewModel = getSectionViewModel(section);
```

Then change the card body from:

```tsx
<div className="px-4 py-3">
  <MarkdownRenderer content={section.body} />
</div>
```

to:

```tsx
<div className="px-4 py-3">
  {viewModel.showCreateLevelControl && <CreateLevelControl />}
  <MarkdownRenderer content={section.body} />
</div>
```

- [ ] **Step 4: Verify focused tests and typecheck**

Run:

```bash
pnpm --filter ludus-web exec vitest run src/components/educationSections.test.ts
pnpm --filter ludus-web typecheck
```

Expected: test passes and typecheck exits 0.

### Task 3: Full Verification And Progress Update

**Files:**
- Modify: `docs/PROGRESS.md`

**Interfaces:**
- Consumes: completion evidence from Task 1 and Task 2.
- Produces: Updated NEXT ACTION and session log.

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm test:run
pnpm build:shell
```

Expected:
- Vitest passes all tests.
- Shell build exits 0.

- [ ] **Step 2: Update `docs/PROGRESS.md`**

Update:
- Current state: mention stage 6c Create-section generator control complete.
- NEXT ACTION: suggest manual UX smoke test or next advanced generator-parameter iteration.
- SESSION LOG: append `[2026-07-09] 阶段 6c 教育面板出题生成器控制台...`.

- [ ] **Step 3: Final status review**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intended files changed.
