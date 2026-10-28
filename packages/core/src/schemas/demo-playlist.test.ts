import { describe, expect, it } from 'vitest';
import {
  DEMO_PLAYLIST_SCHEMA_VERSION,
  isDemoLevelSeed,
  parseDemoPlaylist,
} from './demo-playlist';

const chiCoreFixture = {
  schemaVersion: 1 as const,
  id: 'chi-core',
  titleKey: 'demo.playlist.chiCore',
  defaultLocale: 'en' as const,
  acts: [
    {
      id: 'lights-out',
      gameId: 'lights-out',
      titleKey: 'demo.act.lightsOut',
      level: { seed: 42, difficultyRange: [1, 40] as [number, number] },
      beats: [
        { type: 'speak' as const, narrationKey: 'demo.lo.intro' },
        { type: 'play' as const, narrationKey: 'demo.lo.play', durationHintSec: 45 },
        { type: 'hint' as const, narrationKey: 'demo.lo.hint' },
        { type: 'solve' as const, narrationKey: 'demo.lo.solve' },
        { type: 'reveal' as const, narrationKey: 'demo.lo.reveal', depth: 'L2' as const },
      ],
    },
    {
      id: 'nim',
      gameId: 'nim',
      titleKey: 'demo.act.nim',
      level: { seed: 7, difficultyRange: [1, 50] as [number, number] },
      beats: [
        { type: 'speak' as const, narrationKey: 'demo.nim.intro' },
        { type: 'play' as const, narrationKey: 'demo.nim.play' },
        { type: 'hint' as const, narrationKey: 'demo.nim.hint' },
        { type: 'reveal' as const, narrationKey: 'demo.nim.reveal', depth: 'L2' as const },
      ],
    },
    {
      id: 'sokoban',
      gameId: 'sokoban',
      titleKey: 'demo.act.sokoban',
      level: { seed: 0, difficultyRange: [1, 25] as [number, number] },
      beats: [
        { type: 'speak' as const, narrationKey: 'demo.sk.intro' },
        { type: 'play' as const, narrationKey: 'demo.sk.play' },
        { type: 'solve' as const, narrationKey: 'demo.sk.solve' },
        { type: 'reveal' as const, narrationKey: 'demo.sk.reveal', depth: 'L2' as const },
      ],
    },
  ],
};

describe('DemoPlaylistSchema', () => {
  it('parses the CHI core fixture', () => {
    const playlist = parseDemoPlaylist(chiCoreFixture);
    expect(playlist.schemaVersion).toBe(DEMO_PLAYLIST_SCHEMA_VERSION);
    expect(playlist.acts).toHaveLength(3);
    expect(playlist.acts.map(a => a.gameId)).toEqual(['lights-out', 'nim', 'sokoban']);
    expect(isDemoLevelSeed(playlist.acts[0]!.level)).toBe(true);
  });

  it('accepts inline initialState levels', () => {
    const playlist = parseDemoPlaylist({
      ...chiCoreFixture,
      acts: [
        {
          id: 'custom',
          gameId: 'nim',
          titleKey: 'demo.act.nim',
          level: { initialState: { piles: [3, 4, 5], phase: 'choosing', currentPlayer: 0 } },
          beats: [{ type: 'play', narrationKey: 'demo.nim.play' }],
        },
      ],
    });
    expect(isDemoLevelSeed(playlist.acts[0]!.level)).toBe(false);
  });

  it('rejects empty acts or unknown beat types', () => {
    expect(() => parseDemoPlaylist({ ...chiCoreFixture, acts: [] })).toThrow();
    expect(() =>
      parseDemoPlaylist({
        ...chiCoreFixture,
        acts: [
          {
            ...chiCoreFixture.acts[0],
            beats: [{ type: 'teleport', narrationKey: 'x' }],
          },
        ],
      }),
    ).toThrow();
  });
});
