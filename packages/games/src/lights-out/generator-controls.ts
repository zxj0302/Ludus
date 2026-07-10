import type { LevelConfig } from '@ludus/core';
import type { GeneratorControlsSpec } from '../types';

export const lightsOutGeneratorControls: GeneratorControlsSpec = {
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
  buildLevelConfig(difficultyRange, params) {
    return {
      difficultyRange,
      size: Number(params.size),
      requireUniqueSolution: Boolean(params.requireUniqueSolution),
      requireKnownOptimal: Boolean(params.requireKnownOptimal),
      gameParams: {
        minMoves: Number(params.minMoves),
        maxMoves: Number(params.maxMoves),
      },
    };
  },
};
