import type { GamePlugin } from '@ludus/core';
import { lightsOutPlugin } from './lights-out';

const registry = new Map<string, GamePlugin>();

registry.set(lightsOutPlugin.metadata.id, lightsOutPlugin);

export function getGame(id: string): GamePlugin | undefined {
  return registry.get(id);
}

export function getAllGames(): GamePlugin[] {
  return Array.from(registry.values());
}

export { lightsOutPlugin };
