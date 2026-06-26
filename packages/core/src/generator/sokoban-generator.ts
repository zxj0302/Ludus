import type { Level, LevelConfig, Difficulty } from '../types/plugin';
import type { SokobanState } from '../types/sokoban';
import { getLevel, getLevelCount, getRandomLevel, getAllLevels } from './sokoban-levels';
import { computeSokobanDifficulty } from '../solver/sokoban';

export function generateSokobanLevel(config: LevelConfig): Level {
  const [minDiff, maxDiff] = config.difficultyRange;

  // 按难度范围筛选关卡
  const all = getAllLevels();
  const candidates = all.filter(s => {
    const d = computeSokobanDifficulty(s);
    return d.score >= minDiff && d.score <= maxDiff;
  });

  let state: SokobanState;
  if (candidates.length > 0) {
    if (config.seed != null) {
      state = candidates[Math.abs(config.seed) % candidates.length]!;
    } else {
      state = candidates[Math.floor(Math.random() * candidates.length)]!;
    }
  } else {
    // 回退：无匹配难度时随机选一个
    if (config.seed != null) {
      state = getLevel(Math.abs(config.seed) % getLevelCount());
    } else {
      state = getRandomLevel();
    }
  }
  const difficulty = computeSokobanDifficulty(state);

  return {
    schemaVersion: 1,
    gameId: 'sokoban',
    levelId: `level-${Date.now()}`,
    initialState: state,
    difficulty,
    optimalSteps: null, // 求解器耗时较长，不在生成时计算
    uniqueSolution: false,
    generatedBy: 'classic set',
    createdAt: new Date().toISOString(),
  };
}
