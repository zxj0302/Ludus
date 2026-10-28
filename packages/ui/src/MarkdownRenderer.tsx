import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 保护 LaTeX 公式，避免被 Markdown/HTML 解析或 table 拆分破坏 */
function protectMath(text: string): { text: string; mathSpans: string[] } {
  const mathSpans: string[] = [];

  // 1. 保护代码块和行内代码，防止代码中的 $ 被当作公式
  const codeBlocks: string[] = [];
  let protectedText = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (m) => {
    codeBlocks.push(m);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  const render = (formula: string, displayMode: boolean) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode, throwOnError: false });
    } catch {
      return `<code>${escapeHtml(formula)}</code>`;
    }
  };

  // 2. 块级公式 $$...$$ 与 \[...\]
  protectedText = protectedText.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    mathSpans.push(render(formula, true));
    return `\x00MATH${mathSpans.length - 1}\x00`;
  });
  protectedText = protectedText.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => {
    mathSpans.push(render(formula, true));
    return `\x00MATH${mathSpans.length - 1}\x00`;
  });

  // 3. 行内公式 $...$（排除金额如 $100）与 \(...\)
  protectedText = protectedText.replace(/\$([^\$\n]+?)\$/g, (m, formula) => {
    if (/^\d+(\.\d+)?$/.test(formula.trim())) return m;
    mathSpans.push(render(formula, false));
    return `\x00MATH${mathSpans.length - 1}\x00`;
  });
  protectedText = protectedText.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => {
    mathSpans.push(render(formula, false));
    return `\x00MATH${mathSpans.length - 1}\x00`;
  });

  // 4. 还原代码块
  protectedText = protectedText.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)] ?? '');

  return { text: protectedText, mathSpans };
}

/** 拆分 table 行，剥离外层边框管道符，保留内部故意为空的列 */
function splitTableCells(row: string): string[] {
  let trimmed = row.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map(c => c.trim());
}

/** 简易 Markdown → HTML（导出供单测） */
export function mdToHtml(md: string): string {
  const { text, mathSpans } = protectMath(md);
  let html = '';
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = '';
  let inTable = false;
  let tableRows: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    html += '<div class="overflow-x-auto my-3"><table class="w-full text-xs border-collapse"><thead>';
    const headerCells = splitTableCells(tableRows[0]!);
    html += '<tr>' + headerCells.map(c => `<th class="border border-warm-stone-300 px-2 py-1 bg-warm-stone-100 text-left font-semibold">${inlineFormat(c)}</th>`).join('') + '</tr></thead><tbody>';
    for (let r = 1; r < tableRows.length; r++) {
      const cells = splitTableCells(tableRows[r]!);
      html += '<tr>' + cells.map(c => `<td class="border border-warm-stone-200 px-2 py-1">${inlineFormat(c)}</td>`).join('') + '</tr>';
    }
    html += '</tbody></table></div>';
    inTable = false;
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const line = raw.trim();

    // Code block fence
    if (line.startsWith('```')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      if (inCodeBlock) {
        const langClass = codeLang ? ` class="language-${codeLang}"` : '';
        html += `<pre class="bg-warm-stone-100 rounded-lg p-3 overflow-x-auto text-xs my-3 font-mono leading-relaxed"><code${langClass}>${escapeHtml(codeContent.trim())}</code></pre>`;
        inCodeBlock = false;
        codeContent = '';
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += raw + '\n';
      continue;
    }

    // Table
    if (line.startsWith('|') && line.endsWith('|')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      if (!inTable) { inTable = true; tableRows = []; }
      if (line.includes('---') && line.includes('|')) continue;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Skip empty
    if (!line) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      continue;
    }

    // Skip yaml frontmatter
    if (line === '---' && i === 0) {
      while (i + 1 < lines.length && lines[i + 1]?.trim() !== '---') i++;
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('#### ')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      html += `<h5 class="text-xs font-bold text-warm-stone-800 mt-3 mb-1 scroll-mt-28">${inlineFormat(line.slice(5))}</h5>`;
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      html += `<h4 class="text-sm font-bold text-warm-stone-800 mt-4 mb-1 scroll-mt-28">${inlineFormat(line.slice(4))}</h4>`;
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      const headingText = line.slice(3);
      // 从中英双语标题中提取英文部分作为 ID（如 "2. 思考 · Think" → "Think"）
      const englishPart = headingText.includes('·') ? headingText.split('·').pop()!.trim() : headingText;
      const idSlug = englishPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 32);
      const idAttr = idSlug ? ` id="section-${idSlug}"` : '';
      html += `<h3 class="text-base font-bold text-warm-stone-800 mt-5 mb-2 scroll-mt-28"${idAttr}>${inlineFormat(headingText)}</h3>`;
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      html += `<h2 class="text-lg font-bold text-warm-stone-900 mt-0 mb-3 scroll-mt-28">${inlineFormat(line.slice(2))}</h2>`;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      html += `<blockquote class="border-l-2 border-logic-indigo-400 pl-3 py-1 my-2 text-xs text-warm-stone-600 italic bg-logic-indigo-50/50 rounded-r-lg">${inlineFormat(line.slice(2))}</blockquote>`;
      continue;
    }

    // Horizontal rule
    if (line === '---') {
      if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
      html += '<hr class="my-4 border-warm-stone-200" />';
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      if (inList !== 'ol') {
        if (inList === 'ul') html += '</ul>';
        html += '<ol class="list-decimal pl-5 text-xs text-warm-stone-700 space-y-0.5 my-2">';
        inList = 'ol';
      }
      html += `<li>${inlineFormat(line.slice(numMatch[0].length))}</li>`;
      continue;
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (inList !== 'ul') {
        if (inList === 'ol') html += '</ol>';
        html += '<ul class="list-disc pl-5 text-xs text-warm-stone-700 space-y-0.5 my-2">';
        inList = 'ul';
      }
      html += `<li>${inlineFormat(line.slice(2))}</li>`;
      continue;
    }

    // Regular paragraph
    if (inList) { html += inList === 'ul' ? '</ul>' : '</ol>'; inList = null; }
    html += `<p class="text-xs text-warm-stone-700 leading-relaxed my-1.5">${inlineFormat(line)}</p>`;
  }

  if (inCodeBlock) {
    html += `<pre class="bg-warm-stone-100 rounded-lg p-3 overflow-x-auto text-xs my-3 font-mono"><code>${escapeHtml(codeContent.trim())}</code></pre>`;
  }
  if (inList) html += inList === 'ul' ? '</ul>' : '</ol>';
  flushTable();

  // 还原 LaTeX 公式 HTML
  html = html.replace(/\x00MATH(\d+)\x00/g, (_, i) => mathSpans[parseInt(i)] ?? '');

  return html;
}

function inlineFormat(text: string): string {
  // 保护已有的 HTML tags，避免被 markdown 格式化破坏
  const htmlBlocks: string[] = [];
  const protected1 = text.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (m) => {
    htmlBlocks.push(m);
    return `\x00HTML${htmlBlocks.length - 1}\x00`;
  });

  let result = protected1;
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-warm-stone-800">$1</strong>');
  result = result.replace(/`([^`]+)`/g, '<code class="bg-warm-stone-100 text-logic-indigo-700 px-1 rounded text-xs font-mono">$1</code>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-logic-indigo-600 underline underline-offset-2 hover:text-logic-indigo-800">$1</a>',
  );

  // 恢复 HTML blocks
  result = result.replace(/\x00HTML(\d+)\x00/g, (_, i) => htmlBlocks[parseInt(i)] ?? '');

  return result;
}

export function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => mdToHtml(content), [content]);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
