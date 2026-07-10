import { describe, expect, it } from 'vitest';
import { splitEducationSections } from './educationSectionParser';

const sampleMd = `
# Lights Out

## 1. 玩 · Play
Play body content.

## 2. 思考 · Think
Think body content.

## Solve
Solver body without numbering.

## 5. 出题 · Create
Create body content.
`;

describe('splitEducationSections', () => {
  it('parses bilingual numbered headings and plain english headings', () => {
    const sections = splitEducationSections(sampleMd);
    expect(sections.map(s => s.key)).toEqual(['play', 'think', 'solve', 'create']);
    expect(sections[0]).toMatchObject({
      key: 'play',
      english: 'Play',
      chinese: '玩',
      body: 'Play body content.',
    });
    expect(sections[2]?.english).toBe('Solve');
  });

  it('ignores unknown headings and empty bodies', () => {
    const md = `
## 1. 玩 · Play

## Random Section
Should be ignored.

## 2. 思考 · Think
Valid body.
`;
    const sections = splitEducationSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.key).toBe('think');
  });

  it('is case-insensitive for stage keys', () => {
    const md = '## CREATE\nCreate section body.';
    const sections = splitEducationSections(md);
    expect(sections[0]?.key).toBe('create');
  });
});
