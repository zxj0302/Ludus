import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DIFFICULTY_PRESETS,
  presetToRange,
  rangeToPreset,
  type DifficultyPreset,
} from './difficultyPresets';

export interface DifficultySelectorProps {
  value: [number, number];
  /** Called when user picks a new preset; parent should update store and optionally regenerate. */
  onPresetChange: (range: [number, number], preset: DifficultyPreset) => void;
  /** Optional explicit regenerate button (same preset, new seed). */
  onGenerate?: () => void;
  /** Optional secondary generator action shown as its own button (not inside the select). */
  onAdvancedSelect?: () => void;
  advancedLabelKey?: string;
  showAdvancedUnavailable?: boolean;
  advancedUnavailableLabelKey?: string;
  generateLabelKey?: string;
  className?: string;
}

const wrapperClass =
  'relative inline-flex items-center rounded-btn text-xs font-medium ' +
  'bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 ' +
  'cursor-pointer transition-all duration-150';

const selectClass =
  'appearance-none bg-transparent border-0 outline-none ' +
  'w-16 px-2.5 py-1.5 pr-5 cursor-pointer text-xs font-medium text-warm-stone-700';

const arrowClass =
  'pointer-events-none absolute right-1.5 text-warm-stone-400 text-[10px] leading-none';

const refreshBtnClass =
  'px-2.5 py-1.5 rounded-btn text-xs font-semibold transition-all duration-150 active:scale-[0.97] ' +
  'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 shadow-sm';

const advancedBtnClass =
  'px-2.5 py-1.5 rounded-btn text-xs font-medium transition-all duration-150 active:scale-[0.97] ' +
  'bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 border border-warm-stone-200';

const advancedUnavailableClass =
  'px-2.5 py-1.5 rounded-btn text-xs font-medium text-warm-stone-400 ' +
  'bg-warm-stone-50 border border-warm-stone-100 cursor-not-allowed';

export function DifficultySelector({
  value,
  onPresetChange,
  onGenerate,
  onAdvancedSelect,
  advancedLabelKey = 'generator.advanced.show',
  showAdvancedUnavailable = false,
  advancedUnavailableLabelKey = 'generator.advanced.unavailable',
  generateLabelKey = 'game.toolbar.new',
  className = '',
}: DifficultySelectorProps) {
  const { t } = useTranslation();
  const current = rangeToPreset(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const preset = e.target.value as DifficultyPreset;
      onPresetChange(presetToRange(preset), preset);
    },
    [onPresetChange],
  );

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <label className={wrapperClass}>
        <span className="sr-only">{t('generator.difficulty')}</span>
        <select
          value={current}
          onChange={handleChange}
          className={selectClass}
          aria-label={t('generator.difficulty')}
        >
          {DIFFICULTY_PRESETS.map(opt => (
            <option key={opt.key} value={opt.key}>
              {t(opt.i18nKey)}
            </option>
          ))}
        </select>
        <span className={arrowClass} aria-hidden="true">▾</span>
      </label>

      {onAdvancedSelect && (
        <button
          type="button"
          onClick={onAdvancedSelect}
          className={advancedBtnClass}
          aria-label={t(advancedLabelKey)}
        >
          {t(advancedLabelKey)}
        </button>
      )}

      {!onAdvancedSelect && showAdvancedUnavailable && (
        <span
          className={advancedUnavailableClass}
          title={t(advancedUnavailableLabelKey)}
          aria-disabled="true"
        >
          {t(advancedUnavailableLabelKey)}
        </span>
      )}

      {onGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          className={refreshBtnClass}
          title={t(generateLabelKey)}
        >
          + {t(generateLabelKey)}
        </button>
      )}
    </div>
  );
}
