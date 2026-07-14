import { describe, expect, it } from 'vitest';
import {
  buildGeneratorLevelConfig,
  getDefaultGeneratorParams,
  getGeneratorControlSpec,
  summarizeGeneratedLevel,
} from './generatorControls';
import type { Level } from '@ludus/core';

describe('generatorControls', () => {
  it('defines representative advanced controls for Lights Out, Sudoku, and Nonogram', () => {
    expect(getGeneratorControlSpec('lights-out')?.fields.map(f => f.key)).toEqual([
      'size',
      'minMoves',
      'maxMoves',
      'requireUniqueSolution',
      'requireKnownOptimal',
    ]);
    expect(getGeneratorControlSpec('sudoku')?.fields.map(f => f.key)).toEqual([
      'clues',
    ]);
    expect(getGeneratorControlSpec('nonogram')?.fields.map(f => f.key)).toEqual([
      'size',
      'density',
      'requireBacktracking',
    ]);
  });

  it('maps Lights Out parameters into LevelConfig fields and gameParams', () => {
    const config = buildGeneratorLevelConfig('lights-out', [34, 66], {
      size: 3,
      minMoves: 2,
      maxMoves: 8,
      requireUniqueSolution: true,
      requireKnownOptimal: false,
    });

    expect(config).toMatchObject({
      difficultyRange: [34, 66],
      size: 3,
      requireUniqueSolution: true,
      requireKnownOptimal: false,
      gameParams: {
        minMoves: 2,
        maxMoves: 8,
      },
    });
    expect(typeof config.seed).toBe('number');
  });

  it('uses seed 0 for peg-solitaire Hub first-load (classic center-vacant)', () => {
    const a = buildGeneratorLevelConfig('peg-solitaire', [1, 33], null);
    const b = buildGeneratorLevelConfig('peg-solitaire', [1, 33], null);
    expect(a.seed).toBe(0);
    expect(b.seed).toBe(0);
  });

  it('always attaches a fresh seed for games without fixed Hub seed', () => {
    const a = buildGeneratorLevelConfig('sokoban', [1, 33], null);
    const b = buildGeneratorLevelConfig('sokoban', [1, 33], null);
    expect(typeof a.seed).toBe('number');
    expect(typeof b.seed).toBe('number');
    expect(a.seed).not.toBe(b.seed);
  });

  it('uses safe defaults for Sudoku and Nonogram configs', () => {
    expect(getDefaultGeneratorParams('sudoku')).toEqual({ clues: 28 });
    expect(buildGeneratorLevelConfig('sudoku', [1, 33]).gameParams).toEqual({ clues: 28 });

    expect(getDefaultGeneratorParams('nonogram')).toMatchObject({ size: 8, density: 'balanced' });
    expect(buildGeneratorLevelConfig('nonogram', [67, 100]).gameParams).toEqual({
      density: 'balanced',
      requireBacktracking: false,
    });
  });

  it('summarizes generated level guarantees for the UI', () => {
    const level: Level = {
      schemaVersion: 1,
      gameId: 'lights-out',
      levelId: 'test',
      initialState: {},
      difficulty: { score: 42, factors: {}, labelKey: 'difficulty.medium' },
      optimalSteps: 7,
      uniqueSolution: true,
      generatedBy: 'reverse-solve-gf2',
      createdAt: '2026-07-09T00:00:00.000Z',
    };

    expect(summarizeGeneratedLevel(level)).toEqual([
      { labelKey: 'generator.summary.difficulty', value: 42 },
      { labelKey: 'generator.summary.unique', value: 'generator.value.yes' },
      { labelKey: 'generator.summary.optimal', value: 7 },
      { labelKey: 'generator.summary.method', value: 'generator.method.reverseSolveGf2' },
    ]);
  });
});
