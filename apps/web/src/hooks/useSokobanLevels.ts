import { useState, useEffect, useMemo } from 'react';
import { parseSokobanLevels, getAllLevels } from '@ludus/games';
import type { SokobanState } from '@ludus/games';

import microbanRaw from '../levels/Microban.txt?raw';
import originalRaw from '../levels/Original.xsb?raw';

export interface Collection {
  name: string;
  label: string;
  levels: SokobanState[];
}

function parseSafe(text: string, label: string): SokobanState[] {
  try { return parseSokobanLevels(text); }
  catch (e) { console.error(`[Sokoban] Failed to parse ${label}:`, e); return []; }
}

// 内置关卡来自 core 层单一真相源
const BUILTIN_COLLECTION: Collection = {
  name: 'builtin',
  label: 'Built-in',
  levels: getAllLevels(),
};

const EXTERNAL_TEMPLATES: Omit<Collection, 'levels'>[] = [
  { name: 'microban', label: 'Microban (Skinner)' },
  { name: 'original', label: 'Original + Extra (90)' },
];

let parsed = false;
const EXTERNAL_CACHE: Collection[] = [
  { ...EXTERNAL_TEMPLATES[0]!, levels: [] },
  { ...EXTERNAL_TEMPLATES[1]!, levels: [] },
];

export function useSokobanLevels(enabled = true): Collection[] {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || parsed) return;
    parsed = true;
    EXTERNAL_CACHE[0]!.levels = parseSafe(microbanRaw, 'Microban');
    EXTERNAL_CACHE[1]!.levels = parseSafe(originalRaw, 'Original');
    setVersion(1);
  }, [enabled]);

  // 用 version 而非数组引用控制更新——避免每帧新引用导致无限循环
  return useMemo(() => {
    return [BUILTIN_COLLECTION, ...EXTERNAL_CACHE];
  }, [version]);
}
