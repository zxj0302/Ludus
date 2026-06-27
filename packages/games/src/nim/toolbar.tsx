import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ToolbarSlotProps } from '../types';
import { generateNimLevelByPreset } from './generator';

export function NimToolbarSlot({ dispatch }: ToolbarSlotProps) {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  return (
    <div className="flex gap-1.5 items-center">
      <button
        type="button"
        onClick={() => setDifficulty(d => d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : 'easy')}
        className="text-xs px-2.5 py-1.5 rounded-md bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 transition-colors font-medium"
      >
        {t(`difficulty.${difficulty}`)} ▾
      </button>
      <button
        type="button"
        onClick={() => {
          const level = generateNimLevelByPreset(difficulty);
          dispatch?.({ type: 'loadState', payload: level.initialState });
        }}
        className="text-xs px-2.5 py-1.5 rounded-md bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 transition-colors font-medium"
      >
        + {t('game.toolbar.new')}
      </button>
    </div>
  );
}
