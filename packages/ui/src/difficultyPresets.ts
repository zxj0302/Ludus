/** Standard difficulty presets — aligned with 33/66 thresholds across all games. */

export type DifficultyPreset = 'easy' | 'medium' | 'hard' | 'random';

export interface DifficultyPresetOption {
  key: DifficultyPreset;
  range: [number, number];
  i18nKey: string;
}

export const DIFFICULTY_PRESETS: readonly DifficultyPresetOption[] = [
  { key: 'easy', range: [1, 33], i18nKey: 'difficulty.easy' },
  { key: 'medium', range: [34, 66], i18nKey: 'difficulty.medium' },
  { key: 'hard', range: [67, 100], i18nKey: 'difficulty.hard' },
  { key: 'random', range: [1, 100], i18nKey: 'difficulty.random' },
] as const;

export function rangeToPreset(range: [number, number]): DifficultyPreset {
  if (range[0] === 1 && range[1] === 100) return 'random';
  if (range[1] <= 33) return 'easy';
  if (range[0] === 34 && range[1] === 66) return 'medium';
  if (range[0] >= 67) return 'hard';
  return 'random';
}

export function presetToRange(preset: DifficultyPreset): [number, number] {
  const opt = DIFFICULTY_PRESETS.find(p => p.key === preset);
  return opt?.range ?? [1, 100];
}
