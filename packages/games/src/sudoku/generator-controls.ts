import type { GeneratorControlsSpec } from '../types';

export const sudokuGeneratorControls: GeneratorControlsSpec = {
  titleKey: 'generator.advanced.sudoku.title',
  descriptionKey: 'generator.advanced.sudoku.description',
  defaultParams: {
    clues: 28,
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
  ],
  guarantees: [
    { labelKey: 'generator.guarantee.unique', descriptionKey: 'generator.guarantee.sudokuUnique' },
    { labelKey: 'generator.guarantee.difficultyByClues', descriptionKey: 'generator.guarantee.sudokuClues' },
  ],
  buildLevelConfig(difficultyRange, params) {
    return {
      difficultyRange,
      gameParams: {
        clues: Number(params.clues),
      },
    };
  },
};
