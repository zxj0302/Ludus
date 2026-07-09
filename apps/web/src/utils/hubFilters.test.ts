import { describe, it, expect } from 'vitest';
import type { GamePlugin } from '@ludus/core';
import { filterHubGames, getHubCategories } from './hubFilters';

const t = (key: string) => {
  const map: Record<string, string> = {
    'game.lights-out.name': 'Lights Out',
    'game.lights-out.description': 'Toggle lights with GF(2)',
    'game.sudoku.name': 'Sudoku',
    'game.sudoku.description': 'Fill the grid with DLX',
    'category.linear-algebra': 'Linear Algebra',
    'category.constraint-satisfaction': 'Constraint Satisfaction',
  };
  return map[key] ?? key;
};

function mockGame(id: string, category: string, tags: string[]): GamePlugin {
  return {
    metadata: {
      id,
      nameKey: `game.${id}.name`,
      descriptionKey: `game.${id}.description`,
      category,
      tags,
      renderBackend: 'dom',
      platformSupport: [],
      version: '1.0.0',
    },
    initialState: () => ({}),
    legalMoves: () => [],
    applyMove: (s) => s,
    isSolved: () => false,
    solve: () => ({ solvable: false, moves: [], stats: { nodesExplored: 0, timeMs: 0, solutionLength: 0, solverName: 'test' } }),
    getDifficulty: () => ({ score: 0, factors: {}, labelKey: 'difficulty.easy' }),
    generateLevel: () => ({
      schemaVersion: 1,
      gameId: id,
      levelId: 'test',
      initialState: {},
      difficulty: { score: 0, factors: {}, labelKey: 'difficulty.easy' },
      optimalSteps: null,
      uniqueSolution: true,
      generatedBy: 'test',
      createdAt: new Date().toISOString(),
    }),
    renderBackend: 'dom',
    educationManifest: {
      gameId: id,
      l2ContentPaths: { 'zh-CN': '', en: '' },
      l3ContentPaths: { 'zh-CN': '', en: '' },
      abstractProblemName: { 'zh-CN': '', en: '' },
      complexityClass: 'P',
      knowledgeTags: [],
    },
    visualizationManifest: {
      gameId: id,
      traceType: 'matrix-transform',
      componentName: 'Test',
      library: 'custom-svg',
    },
  };
}

const games = [
  mockGame('lights-out', 'category.linear-algebra', ['GF(2)', 'puzzle']),
  mockGame('sudoku', 'category.constraint-satisfaction', ['DLX', '数独']),
];

describe('getHubCategories', () => {
  it('returns unique sorted categories', () => {
    const cats = getHubCategories(games, t);
    expect(cats).toEqual(['category.constraint-satisfaction', 'category.linear-algebra']);
  });
});

describe('filterHubGames', () => {
  it('returns all games when filters empty', () => {
    expect(filterHubGames(games, { query: '', category: null }, t)).toHaveLength(2);
  });

  it('filters by category', () => {
    const result = filterHubGames(games, { query: '', category: 'category.linear-algebra' }, t);
    expect(result).toHaveLength(1);
    expect(result[0]!.metadata.id).toBe('lights-out');
  });

  it('filters by name query', () => {
    const result = filterHubGames(games, { query: 'sudoku', category: null }, t);
    expect(result).toHaveLength(1);
    expect(result[0]!.metadata.id).toBe('sudoku');
  });

  it('filters by tag (case-insensitive)', () => {
    const result = filterHubGames(games, { query: 'dlx', category: null }, t);
    expect(result).toHaveLength(1);
    expect(result[0]!.metadata.id).toBe('sudoku');
  });

  it('returns empty when no match', () => {
    const result = filterHubGames(games, { query: 'chess', category: null }, t);
    expect(result).toHaveLength(0);
  });
});
