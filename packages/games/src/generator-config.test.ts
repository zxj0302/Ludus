import { describe, expect, it } from 'vitest';
import { mulberry32, readBoolParam, readNumParam, resolveSeed } from './generator-config';

const baseConfig = { difficultyRange: [1, 100] as [number, number] };

describe('generator-config helpers', () => {
  it('readNumParam returns finite numbers from gameParams', () => {
    const config = { ...baseConfig, gameParams: { size: 7 } };
    expect(readNumParam(config, 'size')).toBe(7);
    expect(readNumParam(config, 'size', 5)).toBe(7);
  });

  it('readNumParam rejects NaN and uses fallback', () => {
    const config = { ...baseConfig, gameParams: { size: Number.NaN } };
    expect(readNumParam(config, 'size')).toBeNull();
    expect(readNumParam(config, 'size', 5)).toBe(5);
  });

  it('readBoolParam reads booleans with fallback', () => {
    const config = { ...baseConfig, gameParams: { requireBacktracking: true } };
    expect(readBoolParam(config, 'requireBacktracking')).toBe(true);
    expect(readBoolParam(config, 'missing', false)).toBe(false);
  });

  it('resolveSeed prefers explicit seed', () => {
    expect(resolveSeed({ ...baseConfig, seed: 42 })).toBe(42);
  });

  it('mulberry32 is deterministic for the same seed', () => {
    const rng1 = mulberry32(99);
    const rng2 = mulberry32(99);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });
});
