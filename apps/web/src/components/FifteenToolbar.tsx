import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import type { ToolbarSlotProps } from '@ludus/games';

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'random';

const DIFFICULTIES: { key: DifficultyLevel; range: [number, number]; i18nKey: string }[] = [
  { key: 'easy',   range: [1, 33],   i18nKey: 'difficulty.easy' },
  { key: 'medium', range: [34, 66],  i18nKey: 'difficulty.medium' },
  { key: 'hard',   range: [67, 100], i18nKey: 'difficulty.hard' },
  { key: 'random', range: [1, 100],  i18nKey: 'difficulty.random' },
];

const wrapperClass =
  'relative inline-flex items-center rounded-btn text-xs font-medium ' +
  'bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 ' +
  'cursor-pointer transition-all duration-150';

const selectClass =
  'appearance-none bg-transparent border-0 outline-none ' +
  'px-2.5 py-1.5 pr-5 cursor-pointer text-xs font-medium text-warm-stone-700';

const arrowClass =
  'pointer-events-none absolute right-1.5 text-warm-stone-400 text-[10px] leading-none';

const refreshBtnClass =
  'px-2.5 py-1.5 rounded-btn text-xs font-semibold transition-all duration-150 active:scale-[0.97] ' +
  'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 shadow-sm';

export function FifteenToolbar({ onNewLevel }: ToolbarSlotProps) {
  const { t } = useTranslation();
  const difficultyRange = useGameStore(s => s.difficultyRange);
  const setDifficultyRange = useGameStore(s => s.setDifficultyRange);

  const current: DifficultyLevel =
    difficultyRange[0] === 1 && difficultyRange[1] === 100 ? 'random'
    : difficultyRange[1] <= 33                           ? 'easy'
    : difficultyRange[0] === 34                          ? 'medium'
    :                                                      'hard';

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as DifficultyLevel;
    const opt = DIFFICULTIES.find(d => d.key === key);
    if (!opt) return;
    setDifficultyRange(opt.range);
    onNewLevel();
  }, [setDifficultyRange, onNewLevel]);

  return (
    <>
      <span className={wrapperClass}>
        <select
          value={current}
          onChange={handleChange}
          className={selectClass}
        >
          {DIFFICULTIES.map(opt => (
            <option key={opt.key} value={opt.key}>
              {t(opt.i18nKey)}
            </option>
          ))}
        </select>
        <span className={arrowClass} aria-hidden="true">▾</span>
      </span>
      <button
        type="button"
        onClick={onNewLevel}
        className={refreshBtnClass}
        title={t('game.toolbar.new')}
      >
        + {t('game.toolbar.new')}
      </button>
    </>
  );
}
