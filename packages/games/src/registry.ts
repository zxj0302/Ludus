import type { GamePlugin } from '@ludus/core';
import { lightsOutPlugin } from './lights-out';
import { sokobanPlugin } from './sokoban';
import { sudokuPlugin } from './sudoku';
import { nimPlugin } from './nim';
import { wythoffPlugin } from './wythoff';

const registry = new Map<string, GamePlugin>();

registry.set(lightsOutPlugin.metadata.id, lightsOutPlugin);
registry.set(sokobanPlugin.metadata.id, sokobanPlugin);
registry.set(sudokuPlugin.metadata.id, sudokuPlugin);
registry.set(nimPlugin.metadata.id, nimPlugin);
registry.set(wythoffPlugin.metadata.id, wythoffPlugin);

export function getGame(id: string): GamePlugin | undefined {
  return registry.get(id);
}

export function getAllGames(): GamePlugin[] {
  return Array.from(registry.values());
}

export { lightsOutPlugin, sokobanPlugin, sudokuPlugin, nimPlugin, wythoffPlugin };
