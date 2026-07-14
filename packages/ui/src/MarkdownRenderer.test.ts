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
});
