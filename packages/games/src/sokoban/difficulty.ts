import type { Difficulty } from '@ludus/core';
import type { SokobanState } from './types';
import { computeSokobanDifficulty } from './solver-utils';

export const getDifficulty = (state: SokobanState): Difficulty => computeSokobanDifficulty(state);
