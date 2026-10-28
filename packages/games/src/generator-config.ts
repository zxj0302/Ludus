import type { LevelConfig } from '@ludus/core';

/** Seeded PRNG (mulberry32) for reproducible level generation. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readNumParam(config: LevelConfig, key: string, fallback?: number): number | null {
  const value = config.gameParams?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback ?? null;
}

export function readBoolParam(config: LevelConfig, key: string, fallback?: boolean): boolean | null {
  const value = config.gameParams?.[key];
  if (typeof value === 'boolean') return value;
  return fallback ?? null;
}

export function resolveSeed(config?: LevelConfig): number {
  return config?.seed ?? Math.floor(Math.random() * 0x7fffffff);
}
