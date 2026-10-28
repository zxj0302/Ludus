import { describe, expect, it } from 'vitest';
import { mdToHtml } from './MarkdownRenderer';

describe('mdToHtml tables', () => {
  it('renders a table that ends the markdown input (EOF flush)', () => {
    const md = [
      '### 4.4 文献与开源求解器',
      '',
      '| 作者 | 年份 | 贡献 |',
      '|------|------|------|',
      '| Victor Allis | 1988 | 知识型强解 |',
      '| Christophe Steininger | — | [c4](https://github.com/ChristopheSteininger/c4) |',
    ].join('\n');

    const html = mdToHtml(md);

    expect(html).toContain('<table');
    expect(html).toContain('Victor Allis');
    expect(html).toContain('Christophe Steininger');
    expect(html).toContain('href="https://github.com/ChristopheSteininger/c4"');
  });

  it('preserves intentional empty cells without column misalignment', () => {
    const md = [
      '| Col 1 | Col 2 | Col 3 |',
      '|-------|-------|-------|',
      '| A | | C |',
      '| | B | |',
    ].join('\n');

    const html = mdToHtml(md);

    // Header has 3 columns
    expect(html).toContain('<th class="border border-warm-stone-300 px-2 py-1 bg-warm-stone-100 text-left font-semibold">Col 1</th>');
    expect(html).toContain('<th class="border border-warm-stone-300 px-2 py-1 bg-warm-stone-100 text-left font-semibold">Col 2</th>');
    expect(html).toContain('<th class="border border-warm-stone-300 px-2 py-1 bg-warm-stone-100 text-left font-semibold">Col 3</th>');

    // First row has 3 td elements
    expect(html).toContain('<tr><td class="border border-warm-stone-200 px-2 py-1">A</td><td class="border border-warm-stone-200 px-2 py-1"></td><td class="border border-warm-stone-200 px-2 py-1">C</td></tr>');
    // Second row has 3 td elements
    expect(html).toContain('<tr><td class="border border-warm-stone-200 px-2 py-1"></td><td class="border border-warm-stone-200 px-2 py-1">B</td><td class="border border-warm-stone-200 px-2 py-1"></td></tr>');
  });
});

describe('mdToHtml math protection', () => {
  it('does not mangle formulas containing asterisks as emphasis', () => {
    const md = 'Given formula $a * b * c$ and inline text.';
    const html = mdToHtml(md);

    expect(html).not.toContain('<em>');
    expect(html).toContain('katex');
  });

  it('does not render math inside inline code or code blocks', () => {
    const md = 'Run `echo $HOME` to see your directory.\n\n```bash\necho $PATH\n```';
    const html = mdToHtml(md);

    expect(html).toContain('echo $HOME');
    expect(html).toContain('<code');
    expect(html).toContain('echo $PATH');
    expect(html).not.toContain('katex');
  });
});

describe('mdToHtml inline comparisons and tags', () => {
  it('does not treat plaintext comparisons like < k && k < as HTML tags', () => {
    const md = 'Checking condition: 0 < k && k < 10 in the loop.';
    const html = mdToHtml(md);
    expect(html).toContain('0 < k && k < 10');
  });

  it('renders unordered to ordered list transitions correctly', () => {
    const md = '- item 1\n- item 2\n1. first\n2. second';
    const html = mdToHtml(md);
    expect(html).toContain('<ul');
    expect(html).toContain('</ul><ol');
    expect(html).toContain('</ol>');
  });
});
