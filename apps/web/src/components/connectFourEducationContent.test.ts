import { describe, expect, it } from 'vitest';
import l3zh from '@ludus/education/src/content/connect-four/l3.zh-CN.md?raw';
import l3en from '@ludus/education/src/content/connect-four/l3.en.md?raw';
import { splitEducationSections } from './educationSectionParser';

function stripFrontmatter(md: string): string {
  const parts = md.split(/^---$/m);
  return parts.length >= 3 ? parts.slice(2).join('---').trim() : md;
}

describe('connect-four L3 education content', () => {
  it('parses zh-CN L3 into five section cards', () => {
    const sections = splitEducationSections(stripFrontmatter(l3zh));
    expect(sections.map(s => s.key)).toEqual(['play', 'think', 'reveal', 'solve', 'create']);
    expect(sections.every(s => s.body.length > 0)).toBe(true);
  });

  it('parses en L3 into five section cards', () => {
    const sections = splitEducationSections(stripFrontmatter(l3en));
    expect(sections.map(s => s.key)).toEqual(['play', 'think', 'reveal', 'solve', 'create']);
    expect(sections.every(s => s.body.length > 0)).toBe(true);
  });
});
