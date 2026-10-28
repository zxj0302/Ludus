import type { GamePlugin } from '@ludus/core';
import type { GamePluginEntry } from './types';
import { lightsOutPlugin, lightsOutEntry } from './lights-out';
import { sokobanPlugin, sokobanEntry } from './sokoban';
import { sudokuPlugin, sudokuEntry } from './sudoku';
import { nimPlugin, nimEntry } from './nim';
import { wythoffPlugin, wythoffEntry } from './wythoff';
import { fifteenPlugin, fifteenEntry } from './fifteen';
import { waterJugPlugin, waterJugEntry } from './water-jug';
import { nonogramPlugin, nonogramEntry } from './nonogram';
import { pegSolitairePlugin, pegSolitaireEntry } from './peg-solitaire';
import { connectFourPlugin, connectFourEntry } from './connect-four';
import { euclidsGamePlugin, euclidsGameEntry } from './euclids-game';
import { grundysGamePlugin, grundysGameEntry } from './grundys-game';
import { kaylesPlugin, kaylesEntry } from './kayles';
import { thiefSiegePlugin, thiefSiegeEntry } from './thief-siege';

// -- Plugin registry (core interface) --

const pluginRegistry = new Map<string, GamePlugin>();

pluginRegistry.set(lightsOutPlugin.metadata.id, lightsOutPlugin);
pluginRegistry.set(sokobanPlugin.metadata.id, sokobanPlugin);
pluginRegistry.set(sudokuPlugin.metadata.id, sudokuPlugin);
pluginRegistry.set(nimPlugin.metadata.id, nimPlugin);
pluginRegistry.set(wythoffPlugin.metadata.id, wythoffPlugin);
pluginRegistry.set(fifteenPlugin.metadata.id, fifteenPlugin);
pluginRegistry.set(waterJugPlugin.metadata.id, waterJugPlugin);
pluginRegistry.set(nonogramPlugin.metadata.id, nonogramPlugin);
pluginRegistry.set(pegSolitairePlugin.metadata.id, pegSolitairePlugin);
pluginRegistry.set(connectFourPlugin.metadata.id, connectFourPlugin);
pluginRegistry.set(euclidsGamePlugin.metadata.id, euclidsGamePlugin);
pluginRegistry.set(grundysGamePlugin.metadata.id, grundysGamePlugin);
pluginRegistry.set(kaylesPlugin.metadata.id, kaylesPlugin);
pluginRegistry.set(thiefSiegePlugin.metadata.id, thiefSiegePlugin);

// Games listed on Hub. Parked/unlisted games (e.g. thief-siege) are accessible via direct route /game/:gameId.
const PUBLIC_GAME_IDS = new Set([
  lightsOutPlugin.metadata.id,
  sokobanPlugin.metadata.id,
  sudokuPlugin.metadata.id,
  nimPlugin.metadata.id,
  wythoffPlugin.metadata.id,
  fifteenPlugin.metadata.id,
  waterJugPlugin.metadata.id,
  nonogramPlugin.metadata.id,
  pegSolitairePlugin.metadata.id,
  connectFourPlugin.metadata.id,
  euclidsGamePlugin.metadata.id,
  grundysGamePlugin.metadata.id,
  kaylesPlugin.metadata.id,
]);

export function getGame(id: string): GamePlugin | undefined {
  return pluginRegistry.get(id);
}

export function getAllGames(): GamePlugin[] {
  return Array.from(pluginRegistry.values()).filter(p => PUBLIC_GAME_IDS.has(p.metadata.id));
}

// -- Entry registry (full self-describing entry) --

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const entryRegistry = new Map<string, GamePluginEntry<any, any>>();

entryRegistry.set(lightsOutEntry.plugin.metadata.id, lightsOutEntry);
entryRegistry.set(sokobanEntry.plugin.metadata.id, sokobanEntry);
entryRegistry.set(sudokuEntry.plugin.metadata.id, sudokuEntry);
entryRegistry.set(nimEntry.plugin.metadata.id, nimEntry);
entryRegistry.set(wythoffEntry.plugin.metadata.id, wythoffEntry);
entryRegistry.set(fifteenEntry.plugin.metadata.id, fifteenEntry);
entryRegistry.set(waterJugEntry.plugin.metadata.id, waterJugEntry);
entryRegistry.set(nonogramEntry.plugin.metadata.id, nonogramEntry);
entryRegistry.set(pegSolitaireEntry.plugin.metadata.id, pegSolitaireEntry);
entryRegistry.set(connectFourEntry.plugin.metadata.id, connectFourEntry);
entryRegistry.set(euclidsGameEntry.plugin.metadata.id, euclidsGameEntry);
entryRegistry.set(grundysGameEntry.plugin.metadata.id, grundysGameEntry);
entryRegistry.set(kaylesEntry.plugin.metadata.id, kaylesEntry);
entryRegistry.set(thiefSiegeEntry.plugin.metadata.id, thiefSiegeEntry);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getGameEntry(id: string): GamePluginEntry<any, any> | undefined {
  return entryRegistry.get(id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllEntries(): GamePluginEntry<any, any>[] {
  return Array.from(entryRegistry.values());
}

// -- Re-exports --

export { lightsOutPlugin, sokobanPlugin, sudokuPlugin, nimPlugin, wythoffPlugin, fifteenPlugin, waterJugPlugin, nonogramPlugin, pegSolitairePlugin, connectFourPlugin, euclidsGamePlugin, grundysGamePlugin, kaylesPlugin, thiefSiegePlugin };
export { lightsOutEntry, sokobanEntry, sudokuEntry, nimEntry, wythoffEntry, fifteenEntry, waterJugEntry, nonogramEntry, pegSolitaireEntry, connectFourEntry, euclidsGameEntry, grundysGameEntry, kaylesEntry, thiefSiegeEntry };
