import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const uiSrc = resolve(dirname(fileURLToPath(import.meta.url)), 'DifficultySelector.tsx');

describe('DifficultySelector semantics', () => {
  it('keeps difficulty presets in the native select without action options', () => {
    const source = readFileSync(uiSrc, 'utf8');
    expect(source).not.toContain('__advanced_generation__');
    expect(source).toContain('onAdvancedSelect');
    expect(source).toMatch(/onClick=\{onAdvancedSelect\}/);
  });
});
