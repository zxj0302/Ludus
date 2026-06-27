import type { SokobanState } from './types';

// ═══════════════════════════════════════
// 内置经典 Sokoban 关卡
// 符号: # 墙  @ 玩家  $ 箱子  . 目标  * 箱在目标上  + 玩家在目标上
// ═══════════════════════════════════════

const LEVELS = [
  // Level 1 — 2 boxes，~8 步最优
  [
    '  ####  ',
    '###  ####',
    '#     $ #',
    '# #  #$ #',
    '# . .#@ #',
    '#########',
  ].join('\n'),
  // Level 2 — 2 boxes 对角，~7 步最优
  [
    '######',
    '# .  #',
    '#  $ #',
    '# $  #',
    '#  . #',
    '#  @ #',
    '######',
  ].join('\n'),
  // Level 3 — 2 boxes 并排训练，~4 步最优
  [
    '######',
    '#  . #',
    '# $$ #',
    '#  . #',
    '#  @ #',
    '######',
  ].join('\n'),
];

// ═══════════════════════════════════════
// 解析器
// ═══════════════════════════════════════

export function parseSokobanLevel(text: string): SokobanState {
  const lines = text.split('\n');
  // 去掉尾部和头部空行
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop();
  while (lines.length > 0 && lines[0]!.trim() === '') lines.shift();
  // 去掉 ; 注释行
  const filtered = lines.filter(l => !l.trimStart().startsWith(';'));
  if (filtered.length === 0) throw new Error('Empty level');

  const height = filtered.length;
  const width = Math.max(...filtered.map(l => l.length));

  const walls: boolean[][] = [];
  const goals: { row: number; col: number }[] = [];
  const boxes: { row: number; col: number }[] = [];
  let player: { row: number; col: number } | null = null;

  for (let r = 0; r < height; r++) {
    const row: boolean[] = [];
    const line = filtered[r]!;
    for (let c = 0; c < width; c++) {
      const ch = c < line.length ? line[c]! : ' ';
      switch (ch) {
        case '#': row.push(true); break;
        case '@': row.push(false); player = { row: r, col: c }; break;
        case '+': row.push(false); player = { row: r, col: c }; goals.push({ row: r, col: c }); break;
        case '$': row.push(false); boxes.push({ row: r, col: c }); break;
        case '*': row.push(false); boxes.push({ row: r, col: c }); goals.push({ row: r, col: c }); break;
        case '.': row.push(false); goals.push({ row: r, col: c }); break;
        default: row.push(false); break;
      }
    }
    walls.push(row);
  }

  if (!player) throw new Error('No player');
  if (goals.length === 0) throw new Error('No goals');
  if (boxes.length === 0) throw new Error('No boxes');
  if (boxes.length !== goals.length) throw new Error(`Box(${boxes.length}) != Goal(${goals.length})`);
  return { width, height, player, walls, goals, boxes };
}

/** 解析多关卡文本（空行分隔关卡，; 开头为注释） */
export function parseSokobanLevels(text: string): SokobanState[] {
  const lines = text.split('\n');
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过注释行（XSB 格式以 ; 开头）
    if (trimmed.startsWith(';')) continue;
    if (trimmed === '') {
      if (current.length > 0) { blocks.push(current); current = []; }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  return blocks.map(b => parseSokobanLevel(b.join('\n')));
}

// ═══════════════════════════════════════
// 关卡加载
// ═══════════════════════════════════════

let _cache: SokobanState[] | null = null;

function loadLevels(): SokobanState[] {
  if (!_cache) _cache = LEVELS.map(parseSokobanLevel);
  return _cache;
}

export function getLevelCount(): number { return loadLevels().length; }

export function getLevel(index: number): SokobanState {
  const levels = loadLevels();
  if (index < 0 || index >= levels.length) throw new Error(`Index ${index} out of range`);
  return levels[index]!;
}

/** 随机获取一个关卡 */
export function getRandomLevel(): SokobanState {
  const levels = loadLevels();
  return levels[Math.floor(Math.random() * levels.length)]!;
}

export function getAllLevels(): SokobanState[] { return [...loadLevels()]; }
