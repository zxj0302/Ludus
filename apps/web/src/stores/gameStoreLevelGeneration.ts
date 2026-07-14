import type { GamePlugin, Level } from '@ludus/core';
import i18n from '../i18n';
import { buildGeneratorLevelConfig, type GeneratorParams } from '../generatorControls';

export const DEFAULT_DIFFICULTY_RANGE: [number, number] = [1, 100];

/** Spec-aligned first-open defaults (Hub falls back here when no per-game preset is saved). */
const GAME_DEFAULT_DIFFICULTY_RANGE: Record<string, [number, number]> = {
  // Peg uses catalog UX; Hub first load forces seed 0 (classic) in buildGeneratorLevelConfig.
  // Range is unused by generatePegSolitaireLevel — kept only so Hub has a stable preset key.
};

export function fallbackLevel(plugin: GamePlugin): Level {
  const initialState = plugin.initialState();
  return {
    schemaVersion: 1,
    gameId: plugin.metadata.id,
    levelId: `${plugin.metadata.id}-fallback-${Date.now()}`,
    initialState,
    difficulty: plugin.getDifficulty(initialState),
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'initial-state-fallback',
    createdAt: new Date().toISOString(),
  };
}

export function generatePlayableLevel(
  plugin: GamePlugin,
  difficultyRange?: [number, number],
  params?: GeneratorParams | null,
  options?: { strict?: boolean },
): { ok: true; level: Level } | { ok: false; error: string } {
  try {
    return {
      ok: true,
      level: plugin.generateLevel(buildGeneratorLevelConfig(
        plugin.metadata.id,
        difficultyRange ?? DEFAULT_DIFFICULTY_RANGE,
        params,
      )),
    };
  } catch (err) {
    if (options?.strict) {
      return {
        ok: false,
        error: err instanceof Error && err.message
          ? err.message
          : i18n.t('generator.error.constraintsNotMet'),
      };
    }
    return { ok: true, level: fallbackLevel(plugin) };
  }
}

export function getDifficultyRangeForGame(
  difficultyRangeByGame: Record<string, [number, number]>,
  gameId: string | null,
): [number, number] {
  if (!gameId) return DEFAULT_DIFFICULTY_RANGE;
  return difficultyRangeByGame[gameId]
    ?? GAME_DEFAULT_DIFFICULTY_RANGE[gameId]
    ?? DEFAULT_DIFFICULTY_RANGE;
}
