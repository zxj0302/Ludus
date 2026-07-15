import type { Level, LevelConfig } from '@ludus/core';
import { getGameEntry } from '@ludus/games';
import type {
  GeneratorControlsSpec,
  GeneratorField,
  GeneratorGuarantee,
  GeneratorOption,
  GeneratorParamValue,
  GeneratorParams,
} from '@ludus/games';

export type {
  GeneratorField,
  GeneratorGuarantee,
  GeneratorOption,
  GeneratorParamValue,
  GeneratorParams,
};

export interface GeneratorControlSpec extends GeneratorControlsSpec {
  gameId: string;
}

export function getGeneratorControlSpec(gameId: string | null | undefined): GeneratorControlSpec | null {
  if (!gameId) return null;
  const controls = getGameEntry(gameId)?.generatorControls;
  if (!controls) return null;
  return { gameId, ...controls };
}

export function getDefaultGeneratorParams(gameId: string): GeneratorParams {
  return { ...(getGameEntry(gameId)?.generatorControls?.defaultParams ?? {}) };
}

export function getGeneratorParams(gameId: string, saved?: GeneratorParams): GeneratorParams {
  return { ...getDefaultGeneratorParams(gameId), ...(saved ?? {}) };
}

export function buildGeneratorLevelConfig(
  gameId: string,
  difficultyRange: [number, number],
  params?: GeneratorParams | null,
): LevelConfig {
  // Peg Hub first-load / fallback: seed 0 → classic center-vacant (ADR-026).
  if (gameId === 'peg-solitaire' && params == null) {
    return { difficultyRange, seed: 0 };
  }

  // Fresh seed on every generate so rapid "新关卡" clicks never collide on Date.now().
  const seed = Math.floor(Math.random() * 0x7fffffff);

  if (params === null) return { difficultyRange, seed };

  const controls = getGameEntry(gameId)?.generatorControls;
  if (!controls) return { difficultyRange, seed };

  const built = controls.buildLevelConfig(
    difficultyRange,
    getGeneratorParams(gameId, params),
  );
  return { ...built, seed: built.seed ?? seed };
}

export function summarizeGeneratedLevel(level: Level | null): { labelKey: string; value: string | number }[] {
  if (!level) return [];

  const methodLabelKey = GENERATED_BY_LABEL_KEYS[level.generatedBy] ?? level.generatedBy;

  return [
    { labelKey: 'generator.summary.difficulty', value: level.difficulty.score },
    { labelKey: 'generator.summary.unique', value: level.uniqueSolution ? 'generator.value.yes' : 'generator.value.no' },
    { labelKey: 'generator.summary.optimal', value: level.optimalSteps ?? 'generator.value.unknown' },
    { labelKey: 'generator.summary.method', value: methodLabelKey },
  ];
}

const GENERATED_BY_LABEL_KEYS: Record<string, string> = {
  'reverse-solve-gf2': 'generator.method.reverseSolveGf2',
  'reverse-solve-gf2-fallback': 'generator.method.reverseSolveGf2Fallback',
  'dig-with-dlx': 'generator.method.digWithDlx',
  'generateNonogramLevel': 'generator.method.generateNonogramLevel',
  'generateWaterJugLevel': 'generator.method.generateWaterJugLevel',
  'random-walk': 'generator.method.randomWalk',
  'random-piles': 'generator.method.randomPiles',
  'p-position-bias': 'generator.method.pPositionBias',
  'n-position-bias': 'generator.method.nPositionBias',
  'chain-length': 'generator.method.chainLength',
  'classic set': 'generator.method.classicSet',
  'classic-catalog': 'generator.method.classicSet',
  'initial-state-fallback': 'generator.method.initialStateFallback',
};
