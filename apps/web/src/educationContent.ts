// 教育内容注册表 — 所有游戏的 .md 文件集中管理
// EducationPanel 通过此模块获取内容，无需 import 任何游戏专属文件

import l2zhLO from '@ludus/education/src/content/lights-out/l2.zh-CN.md?raw';
import l2enLO from '@ludus/education/src/content/lights-out/l2.en.md?raw';
import l3zhLO from '@ludus/education/src/content/lights-out/l3.zh-CN.md?raw';
import l3enLO from '@ludus/education/src/content/lights-out/l3.en.md?raw';

import l2zhSK from '@ludus/education/src/content/sokoban/l2.zh-CN.md?raw';
import l2enSK from '@ludus/education/src/content/sokoban/l2.en.md?raw';
import l3zhSK from '@ludus/education/src/content/sokoban/l3.zh-CN.md?raw';
import l3enSK from '@ludus/education/src/content/sokoban/l3.en.md?raw';

import l2zhSU from '@ludus/education/src/content/sudoku/l2.zh-CN.md?raw';
import l2enSU from '@ludus/education/src/content/sudoku/l2.en.md?raw';
import l3zhSU from '@ludus/education/src/content/sudoku/l3.zh-CN.md?raw';
import l3enSU from '@ludus/education/src/content/sudoku/l3.en.md?raw';

import l2zhNI from '@ludus/education/src/content/nim/l2.zh-CN.md?raw';
import l2enNI from '@ludus/education/src/content/nim/l2.en.md?raw';
import l3zhNI from '@ludus/education/src/content/nim/l3.zh-CN.md?raw';
import l3enNI from '@ludus/education/src/content/nim/l3.en.md?raw';

import l2zhWY from '@ludus/education/src/content/wythoff/l2.zh-CN.md?raw';
import l2enWY from '@ludus/education/src/content/wythoff/l2.en.md?raw';
import l3zhWY from '@ludus/education/src/content/wythoff/l3.zh-CN.md?raw';
import l3enWY from '@ludus/education/src/content/wythoff/l3.en.md?raw';

type Locale = 'zh-CN' | 'en';
type Depth = 'L2' | 'L3';

const CONTENT: Record<string, Record<Locale, Record<Depth, string>>> = {
  'lights-out': {
    'zh-CN': { L2: l2zhLO, L3: l3zhLO },
    en:        { L2: l2enLO, L3: l3enLO },
  },
  sokoban: {
    'zh-CN': { L2: l2zhSK, L3: l3zhSK },
    en:        { L2: l2enSK, L3: l3enSK },
  },
  sudoku: {
    'zh-CN': { L2: l2zhSU, L3: l3zhSU },
    en:        { L2: l2enSU, L3: l3enSU },
  },
  nim: {
    'zh-CN': { L2: l2zhNI, L3: l3zhNI },
    en:        { L2: l2enNI, L3: l3enNI },
  },
  wythoff: {
    'zh-CN': { L2: l2zhWY, L3: l3zhWY },
    en:        { L2: l2enWY, L3: l3enWY },
  },
};

/** 从 markdown 提取正文（跳过 frontmatter） */
export function extractBody(md: string): string {
  const parts = md.split(/^---$/m);
  if (parts.length >= 3) return parts.slice(2).join('---').trim();
  return md;
}

export function getEducationContent(gameId: string, locale: string, depth: Depth): string {
  const game = CONTENT[gameId] ?? CONTENT['lights-out']!;
  const lang = (locale === 'en' ? 'en' : 'zh-CN') as Locale;
  return game[lang]?.[depth] ?? game['zh-CN']?.[depth] ?? '';
}
