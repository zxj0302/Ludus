import { describe, expect, it } from 'vitest';
import { parseDemoPlaylist } from '@ludus/core/schemas';
import chiCorePlaylist from './chi-core.json';
import { findVizBeatIndex, nextDemoCursor, prevDemoCursor } from './demoNavigation';

describe('demo playlist navigation', () => {
  const playlist = parseDemoPlaylist(chiCorePlaylist);

  it('findVizBeatIndex prefers solve over reveal', () => {
    expect(findVizBeatIndex(playlist.acts[0]!.beats)).toBe(
      playlist.acts[0]!.beats.findIndex(b => b.type === 'solve'),
    );
    expect(findVizBeatIndex([{ type: 'speak' }, { type: 'reveal' }])).toBe(1);
    expect(findVizBeatIndex([{ type: 'speak' }, { type: 'play' }])).toBeNull();
  });

  it('resets beatIndex to 0 when crossing to the next act', () => {
    const lastBeat = playlist.acts[0]!.beats.length - 1;
    const next = nextDemoCursor(playlist.acts, 0, lastBeat);
    expect(next).toEqual({ actIndex: 1, beatIndex: 0 });
    // Regression: leaving beatIndex at lastBeat would be OOB on Nim (fewer beats).
    expect(next!.beatIndex).toBeLessThan(playlist.acts[1]!.beats.length);
  });

  it('stays null at the end of the playlist', () => {
    const lastAct = playlist.acts.length - 1;
    const lastBeat = playlist.acts[lastAct]!.beats.length - 1;
    expect(nextDemoCursor(playlist.acts, lastAct, lastBeat)).toBeNull();
  });

  it('lands on previous act last beat when going back across acts', () => {
    const prev = prevDemoCursor(playlist.acts, 1, 0);
    expect(prev).toEqual({
      actIndex: 0,
      beatIndex: playlist.acts[0]!.beats.length - 1,
    });
  });
});
