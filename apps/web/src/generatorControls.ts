import type { Level, LevelConfig } from '@ludus/core';

export type GeneratorParamValue = string | number | boolean;
export type GeneratorParams = Record<string, GeneratorParamValue>;

export interface GeneratorOption {
  value: string | number;
  labelKey: string;
}

export interface GeneratorField {
  key: string;
  kind: 'select' | 'number' | 'checkbox';
  labelKey: string;
  helpKey: string;
  min?: number;
  max?: number;
  step?: number;
  options?: GeneratorOption[];
}

export interface GeneratorGuarantee {
  labelKey: string;
  descriptionKey: string;
}

export interface GeneratorControlSpec {
  gameId: string;
  titleKey: string;
  descriptionKey: string;
  fields: GeneratorField[];
  defaultParams: GeneratorParams;
  guarantees: GeneratorGuarantee[];
}

const LIGHTS_OUT_SPEC: GeneratorControlSpec = {
  gameId: 'lights-out',
  titleKey: 'generator.advanced.lightsOut.title',
  descriptionKey: 'generator.advanced.lightsOut.description',
  defaultParams: {
    size: 5,
    minMoves: 3,
    maxMoves: 15,
    requireUniqueSolution: false,
    requireKnownOptimal: true,
  },
  fields: [
    {
      key: 'size',
      kind: 'select',
      labelKey: 'generator.param.boardSize',
      helpKey: 'generator.help.lightsOutSize',
      options: [3, 4, 5, 6].map(value => ({ value, labelKey: `generator.option.size${value}` })),
    },
    {
      key: 'minMoves',
      kind: 'number',
      labelKey: 'generator.param.minMoves',
      helpKey: 'generator.help.minMoves',
      min: 1,
      max: 30,
      step: 1,
    },
    {
      key: 'maxMoves',
      kind: 'number',
      labelKey: 'generator.param.maxMoves',
      helpKey: 'generator.help.maxMoves',
      min: 1,
      max: 30,
      step: 1,
    },
    {
      key: 'requireUniqueSolution',
      kind: 'checkbox',
      labelKey: 'generator.param.uniqueSolution',
      helpKey: 'generator.help.lightsOutUnique',
    },
    {
      key: 'requireKnownOptimal',
      kind: 'checkbox',
      labelKey: 'generator.param.knownOptimal',
      helpKey: 'generator.help.knownOptimal',
    },
  ],
  guarantees: [
    { labelKey: 'generator.guarantee.solvable', descriptionKey: 'generator.guarantee.lightsOutSolvable' },
    { labelKey: 'generator.guarantee.knownOptimal', descriptionKey: 'generator.guarantee.lightsOutOptimal' },
    { labelKey: 'generator.guarantee.uniqueConditional', descriptionKey: 'generator.guarantee.lightsOutUnique' },
  ],
};

const SUDOKU_SPEC: GeneratorControlSpec = {
  gameId: 'sudoku',
  titleKey: 'generator.advanced.sudoku.title',
  descriptionKey: 'generator.advanced.sudoku.description',
  defaultParams: {
    clues: 28,
    requireUniqueSolution: true,
  },
  fields: [
    {
      key: 'clues',
      kind: 'number',
      labelKey: 'generator.param.clues',
      helpKey: 'generator.help.sudokuClues',
      min: 17,
      max: 36,
      step: 1,
    },
    {
      key: 'requireUniqueSolution',
      kind: 'checkbox',
      labelKey: 'generator.param.uniqueSolution',
      helpKey: 'generator.help.sudokuUnique',
    },
  ],
  guarantees: [
    { labelKey: 'generator.guarantee.unique', descriptionKey: 'generator.guarantee.sudokuUnique' },
    { labelKey: 'generator.guarantee.difficultyByClues', descriptionKey: 'generator.guarantee.sudokuClues' },
  ],
};

const NONOGRAM_SPEC: GeneratorControlSpec = {
  gameId: 'nonogram',
  titleKey: 'generator.advanced.nonogram.title',
  descriptionKey: 'generator.advanced.nonogram.description',
  defaultParams: {
    size: 8,
    density: 'balanced',
    requireBacktracking: false,
  },
  fields: [
    {
      key: 'size',
      kind: 'select',
      labelKey: 'generator.param.gridSize',
      helpKey: 'generator.help.nonogramSize',
      options: [5, 6, 8, 10].map(value => ({ value, labelKey: `generator.option.size${value}` })),
    },
    {
      key: 'density',
      kind: 'select',
      labelKey: 'generator.param.density',
      helpKey: 'generator.help.nonogramDensity',
      options: [
        { value: 'sparse', labelKey: 'generator.option.densitySparse' },
        { value: 'balanced', labelKey: 'generator.option.densityBalanced' },
        { value: 'dense', labelKey: 'generator.option.densityDense' },
      ],
    },
    {
      key: 'requireBacktracking',
      kind: 'checkbox',
      labelKey: 'generator.param.requireBacktracking',
      helpKey: 'generator.help.requireBacktracking',
    },
  ],
  guarantees: [
    { labelKey: 'generator.guarantee.unique', descriptionKey: 'generator.guarantee.nonogramUnique' },
    { labelKey: 'generator.guarantee.difficultyControlled', descriptionKey: 'generator.guarantee.nonogramDifficulty' },
  ],
};

export const GENERATOR_CONTROL_SPECS: Record<string, GeneratorControlSpec> = {
  'lights-out': LIGHTS_OUT_SPEC,
  sudoku: SUDOKU_SPEC,
  nonogram: NONOGRAM_SPEC,
};

export function getGeneratorControlSpec(gameId: string | null | undefined): GeneratorControlSpec | null {
  return gameId ? GENERATOR_CONTROL_SPECS[gameId] ?? null : null;
}

export function getDefaultGeneratorParams(gameId: string): GeneratorParams {
  return { ...(GENERATOR_CONTROL_SPECS[gameId]?.defaultParams ?? {}) };
}

export function getGeneratorParams(gameId: string, saved?: GeneratorParams): GeneratorParams {
  return { ...getDefaultGeneratorParams(gameId), ...(saved ?? {}) };
}

export function buildGeneratorLevelConfig(
  gameId: string,
  difficultyRange: [number, number],
  params?: GeneratorParams | null,
): LevelConfig {
  if (params === null) return { difficultyRange };

  const merged = getGeneratorParams(gameId, params);

  if (gameId === 'lights-out') {
    const size = Number(merged.size);
    return {
      difficultyRange,
      size,
      requireUniqueSolution: Boolean(merged.requireUniqueSolution),
      requireKnownOptimal: Boolean(merged.requireKnownOptimal),
      gameParams: {
        minMoves: Number(merged.minMoves),
        maxMoves: Number(merged.maxMoves),
      },
    };
  }

  if (gameId === 'sudoku') {
    return {
      difficultyRange,
      requireUniqueSolution: Boolean(merged.requireUniqueSolution),
      gameParams: {
        clues: Number(merged.clues),
      },
    };
  }

  if (gameId === 'nonogram') {
    const size = Number(merged.size);
    return {
      difficultyRange,
      size,
      gameParams: {
        density: String(merged.density),
        requireBacktracking: Boolean(merged.requireBacktracking),
      },
    };
  }

  return { difficultyRange };
}

export function summarizeGeneratedLevel(level: Level | null): { labelKey: string; value: string | number }[] {
  if (!level) return [];

  return [
    { labelKey: 'generator.summary.difficulty', value: level.difficulty.score },
    { labelKey: 'generator.summary.unique', value: level.uniqueSolution ? 'generator.value.yes' : 'generator.value.no' },
    { labelKey: 'generator.summary.optimal', value: level.optimalSteps ?? 'generator.value.unknown' },
    { labelKey: 'generator.summary.method', value: level.generatedBy },
  ];
}
