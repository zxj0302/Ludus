import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const uiSrc = resolve(dirname(fileURLToPath(import.meta.url)), 'DifficultySelector.tsx');

describe('DifficultySelector layout', () => {
  it('keeps advanced generation inside the difficulty dropdown, not as a toolbar button', () => {
    const source = readFileSync(uiSrc, 'utf8');
    expect(source).toContain('ADVANCED_OPTION_VALUE');
    expect(source).not.toMatch(/onClick=\{onAdvancedSelect\}/);
    expect(source).not.toContain('flex-wrap');
  });
});
