import { describe, it, expect } from 'vitest';
import { rangeToPreset, presetToRange } from './difficultyPresets';

describe('difficultyPresets', () => {
  it('maps standard ranges to presets', () => {
    expect(rangeToPreset([1, 33])).toBe('easy');
    expect(rangeToPreset([34, 66])).toBe('medium');
    expect(rangeToPreset([67, 100])).toBe('hard');
    expect(rangeToPreset([1, 100])).toBe('random');
  });

  it('round-trips preset to range', () => {
    for (const key of ['easy', 'medium', 'hard', 'random'] as const) {
      expect(rangeToPreset(presetToRange(key))).toBe(key);
    }
  });
});
