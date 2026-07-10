import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import {
  getGeneratorControlSpec,
  getGeneratorParams,
  summarizeGeneratedLevel,
  type GeneratorField,
  type GeneratorParamValue,
} from '../generatorControls';

function AdvancedField({
  field,
  value,
  onChange,
}: {
  field: GeneratorField;
  value: GeneratorParamValue;
  onChange: (value: GeneratorParamValue) => void;
}) {
  const { t } = useTranslation();

  if (field.kind === 'checkbox') {
    return (
      <label className="flex items-start gap-3 rounded-card border border-violet-100 bg-white px-3 py-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-violet-600"
        />
        <span>
          <span className="block text-sm font-semibold text-warm-stone-800">{t(field.labelKey)}</span>
          <span className="block text-xs text-warm-stone-500">{t(field.helpKey)}</span>
        </span>
      </label>
    );
  }

  return (
    <label className="block rounded-card border border-violet-100 bg-white px-3 py-2">
      <span className="block text-sm font-semibold text-warm-stone-800">{t(field.labelKey)}</span>
      <span className="mb-2 block text-xs text-warm-stone-500">{t(field.helpKey)}</span>
      {field.kind === 'select' ? (
        <select
          value={String(value)}
          onChange={e => onChange(Number.isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
          className="w-full rounded-lg border border-warm-stone-200 bg-white px-3 py-2 text-sm text-warm-stone-800"
        >
          {field.options?.map(option => (
            <option key={String(option.value)} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={Number(value)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-warm-stone-200 bg-white px-3 py-2 text-sm text-warm-stone-800"
        />
      )}
    </label>
  );
}

function formatSummaryValue(value: string | number, t: ReturnType<typeof useTranslation>['t']) {
  if (typeof value === 'string' && value.startsWith('generator.')) return t(value);
  return value;
}

export function AdvancedGeneratorToolbarPanel() {
  const { t } = useTranslation();
  const gameId = useGameStore(s => s.gameId);
  const newLevel = useGameStore(s => s.newLevel);
  const generatorParamsByGame = useGameStore(s => s.generatorParamsByGame);
  const setGeneratorParam = useGameStore(s => s.setGeneratorParam);
  const resetGeneratorParams = useGameStore(s => s.resetGeneratorParams);
  const lastGeneratedLevel = useGameStore(s => s.lastGeneratedLevel);
  const generatorError = useGameStore(s => s.generatorError);

  const spec = getGeneratorControlSpec(gameId);
  const params = useMemo(
    () => gameId ? getGeneratorParams(gameId, generatorParamsByGame[gameId]) : {},
    [gameId, generatorParamsByGame],
  );
  const summary = useMemo(
    () => summarizeGeneratedLevel(lastGeneratedLevel?.gameId === gameId ? lastGeneratedLevel : null),
    [gameId, lastGeneratedLevel],
  );

  const handleParamChange = useCallback(
    (key: string, value: GeneratorParamValue) => {
      if (!gameId) return;
      setGeneratorParam(gameId, key, value);
    },
    [gameId, setGeneratorParam],
  );

  const handleReset = useCallback(() => {
    if (!gameId) return;
    resetGeneratorParams(gameId);
  }, [gameId, resetGeneratorParams]);

  const handleGenerateAdvanced = useCallback(() => {
    newLevel({ useGeneratorParams: true });
  }, [newLevel]);

  if (!spec) return null;

  return (
    <div className="mt-3 space-y-3 rounded-card border border-violet-200 bg-violet-50 px-3 py-3">
      <div>
        <h4 className="text-sm font-bold text-violet-800">{t(spec.titleKey)}</h4>
        <p className="text-xs text-warm-stone-600">{t(spec.descriptionKey)}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {spec.fields.map(field => (
          <AdvancedField
            key={field.key}
            field={field}
            value={params[field.key] ?? spec.defaultParams[field.key] ?? ''}
            onChange={value => handleParamChange(field.key, value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateAdvanced}
          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
        >
          {t('generator.action.generateWithParams')}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
        >
          {t('generator.action.resetParams')}
        </button>
      </div>

      {generatorError && (
        <p className="rounded-card border border-game-amber-200 bg-game-amber-50 px-3 py-2 text-xs text-game-amber-800">
          {generatorError}
        </p>
      )}

      <div className="rounded-card border border-violet-100 bg-white px-3 py-2">
        <h5 className="text-xs font-bold uppercase tracking-wide text-violet-700">
          {t('generator.guarantees.title')}
        </h5>
        <div className="mt-2 space-y-1">
          {spec.guarantees.map(item => (
            <p key={item.labelKey} className="text-xs text-warm-stone-600">
              <span className="font-semibold text-warm-stone-800">{t(item.labelKey)}: </span>
              {t(item.descriptionKey)}
            </p>
          ))}
        </div>
      </div>

      {summary.length > 0 && (
        <div className="rounded-card border border-violet-100 bg-white px-3 py-2">
          <h5 className="text-xs font-bold uppercase tracking-wide text-violet-700">
            {t('generator.summary.title')}
          </h5>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {summary.map(item => (
              <div key={item.labelKey}>
                <dt className="text-xs text-warm-stone-500">{t(item.labelKey)}</dt>
                <dd className="text-sm font-semibold text-warm-stone-800">
                  {formatSummaryValue(item.value, t)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
