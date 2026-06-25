import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
}

/** 将 LaTeX 公式渲染为 HTML */
function renderMath(text: string): string {
  // $$...$$ block math (multiline support)
  let html = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
    } catch { return `<code>${escapeHtml(formula)}</code>`; }
  });
  // $...$ inline math (single line, not followed by another $)
  html = html.replace(/\$(.+?)\$/g, (_, formula) => {
    // 排除纯文本中的 $ 符号（如价格）
    if (/^\d+(\.\d+)?$/.test(formula.trim())) return `$${formula}$`;
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch { return `<code>${escapeHtml(formula)}</code>`; }
  });
  return html;
}

/** 拆分 table 行，保护 $...$ 内的 | 不被当作列分隔符 */
function splitTableCells(row: string): string[] {
  const mathSpans: string[] = [];
  // 保护 $$...$$ 和 $...$，避免内部 | 被拆分
  let protectedRow = row.replace(/\$\$[\s\S]*?\$\$/g, (m) => {
    mathSpans.push(m);
    return `\x00M${mathSpans.length - 1}\x00`;
  });
  protectedRow = protectedRow.replace(/\$(.+?)\$/g, (m) => {
    mathSpans.push(m);
    return `\x00M${mathSpans.length - 1}\x00`;
  });
  const cells = protectedRow.split('|').map(c => c.trim());
  // 还原 math span
  return cells.map(c => c.replace(/\x00M(\d+)\x00/g, (_, i) => mathSpans[parseInt(i)] ?? ''));
}

/** 简易 Markdown → HTML */
function mdToHtml(md: string): string {
  let html = '';
  const lines = md.split('\n');
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = '';
  let inTable = false;
  let tableRows: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

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
      if (tableRows.length > 0) {
        html += '<div class="overflow-x-auto my-3"><table class="w-full text-xs border-collapse"><thead>';
        const headerCells = splitTableCells(tableRows[0]!).filter(c => c);
        html += '<tr>' + headerCells.map(c => `<th class="border border-warm-stone-300 px-2 py-1 bg-warm-stone-100 text-left font-semibold">${inlineFormat(c)}</th>`).join('') + '</tr></thead><tbody>';
        for (let r = 1; r < tableRows.length; r++) {
          const cells = splitTableCells(tableRows[r]!).filter(c => c);
          html += '<tr>' + cells.map(c => `<td class="border border-warm-stone-200 px-2 py-1">${inlineFormat(c)}</td>`).join('') + '</tr>';
        }
        html += '</tbody></table></div>';
      }
      inTable = false;
      tableRows = [];
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
        else if (inList === 'ol') html += '</ol>';
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
        else if (inList === 'ul') html += '</ul>';
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

  return html;
}

function inlineFormat(text: string): string {
  // 保护已有的 HTML tags，避免被 markdown 格式化破坏
  const htmlBlocks: string[] = [];
  const protected1 = text.replace(/<[^>]+>/g, (m) => {
    htmlBlocks.push(m);
    return `\x00HTML${htmlBlocks.length - 1}\x00`;
  });

  let result = protected1;
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-warm-stone-800">$1</strong>');
  result = result.replace(/`([^`]+)`/g, '<code class="bg-warm-stone-100 text-logic-indigo-700 px-1 rounded text-xs font-mono">$1</code>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 恢复 HTML blocks
  result = result.replace(/\x00HTML(\d+)\x00/g, (_, i) => htmlBlocks[parseInt(i)] ?? '');

  return result;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    // 先解析 markdown 结构，再在文本内容中渲染 LaTeX
    const markdownHtml = mdToHtml(content);
    return renderMath(markdownHtml);
  }, [content]);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
