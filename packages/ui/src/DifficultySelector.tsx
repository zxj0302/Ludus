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
  /** Optional advanced generation toggle, shown inside the difficulty dropdown (not as a toolbar button). */
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

const ADVANCED_OPTION_VALUE = '__advanced_generation__';

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
      if (e.target.value === ADVANCED_OPTION_VALUE) {
        onAdvancedSelect?.();
        // Keep the visible preset so re-selecting the same difficulty still fires onChange later.
        e.target.value = current;
        return;
      }
      const preset = e.target.value as DifficultyPreset;
      onPresetChange(presetToRange(preset), preset);
    },
    [current, onAdvancedSelect, onPresetChange],
  );

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
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
          {(onAdvancedSelect || showAdvancedUnavailable) && (
            <>
              <option disabled value="__separator__">────────</option>
              {onAdvancedSelect ? (
                <option value={ADVANCED_OPTION_VALUE}>{t(advancedLabelKey)}</option>
              ) : (
                <option disabled value="__advanced_unavailable__">{t(advancedUnavailableLabelKey)}</option>
              )}
            </>
          )}
        </select>
        <span className={arrowClass} aria-hidden="true">▾</span>
      </label>

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
