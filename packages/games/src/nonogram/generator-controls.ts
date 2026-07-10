import type { GeneratorControlsSpec } from '../types';

export const nonogramGeneratorControls: GeneratorControlsSpec = {
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
  buildLevelConfig(difficultyRange, params) {
    return {
      difficultyRange,
      size: Number(params.size),
      gameParams: {
        density: String(params.density),
        requireBacktracking: Boolean(params.requireBacktracking),
      },
    };
  },
};
