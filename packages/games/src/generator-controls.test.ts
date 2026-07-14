import { describe, expect, it } from 'vitest';
import { getGameEntry } from './registry';

describe('GamePluginEntry generator controls', () => {
  it('lights-out entry exposes advanced generator metadata and LevelConfig mapping', () => {
    const controls = getGameEntry('lights-out')?.generatorControls;
    expect(controls?.fields.map(f => f.key)).toEqual([
      'size',
      'minMoves',
      'maxMoves',
      'requireUniqueSolution',
      'requireKnownOptimal',
    ]);
    expect(controls?.buildLevelConfig([34, 66], {
      size: 3,
      minMoves: 2,
      maxMoves: 8,
      requireUniqueSolution: true,
      requireKnownOptimal: false,
    })).toEqual({
      difficultyRange: [34, 66],
      size: 3,
      requireUniqueSolution: true,
      requireKnownOptimal: false,
      gameParams: {
        minMoves: 2,
        maxMoves: 8,
      },
    });
  });

  it('sudoku entry exposes clue-based advanced generator metadata', () => {
    const controls = getGameEntry('sudoku')?.generatorControls;
    expect(controls?.fields.map(f => f.key)).toEqual(['clues']);
    expect(controls?.defaultParams).toEqual({ clues: 28 });
    expect(controls?.buildLevelConfig([1, 33], { clues: 28 }).gameParams).toEqual({ clues: 28 });
  });

  it('nonogram entry exposes size/density/backtracking controls', () => {
    const controls = getGameEntry('nonogram')?.generatorControls;
    expect(controls?.fields.map(f => f.key)).toEqual([
      'size',
      'density',
      'requireBacktracking',
    ]);
    expect(controls?.defaultParams).toMatchObject({ size: 8, density: 'balanced' });
    expect(controls?.buildLevelConfig([67, 100], {
      size: 8,
      density: 'balanced',
      requireBacktracking: false,
    }).gameParams).toEqual({
      density: 'balanced',
      requireBacktracking: false,
    });
  });

  it('games without advanced controls omit generatorControls', () => {
    expect(getGameEntry('nim')?.generatorControls).toBeUndefined();
    expect(getGameEntry('sokoban')?.generatorControls).toBeUndefined();
    expect(getGameEntry('peg-solitaire')?.generatorControls).toBeUndefined();
  });
});
