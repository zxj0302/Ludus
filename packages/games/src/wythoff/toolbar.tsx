import { useTranslation } from 'react-i18next';
import type { ToolbarSlotProps } from '../types';
import { generateWythoffLevel } from './generator';

export function WythoffToolbarSlot({ dispatch }: ToolbarSlotProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        const level = generateWythoffLevel();
        dispatch?.({ type: 'loadState', payload: level.initialState });
      }}
      className="text-xs px-2.5 py-1.5 rounded-md bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 transition-colors font-medium"
    >
      + {t('game.toolbar.new')}
    </button>
  );
}
