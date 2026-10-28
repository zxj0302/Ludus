/** Pure navigation helpers for CHI Demo Mode (testable without React). */

/** First solve beat in this act, else first reveal, else null. */
export function findVizBeatIndex(beats: { type: string }[]): number | null {
  const solveIdx = beats.findIndex(b => b.type === 'solve');
  if (solveIdx >= 0) return solveIdx;
  const revealIdx = beats.findIndex(b => b.type === 'reveal');
  if (revealIdx >= 0) return revealIdx;
  return null;
}

export function nextDemoCursor(
  acts: { beats: unknown[] }[],
  actIndex: number,
  beatIndex: number,
): { actIndex: number; beatIndex: number } | null {
  const act = acts[actIndex];
  if (!act) return null;
  if (beatIndex + 1 < act.beats.length) {
    return { actIndex, beatIndex: beatIndex + 1 };
  }
  if (actIndex + 1 < acts.length) {
    return { actIndex: actIndex + 1, beatIndex: 0 };
  }
  return null;
}

export function prevDemoCursor(
  acts: { beats: unknown[] }[],
  actIndex: number,
  beatIndex: number,
): { actIndex: number; beatIndex: number } | null {
  if (beatIndex > 0) {
    return { actIndex, beatIndex: beatIndex - 1 };
  }
  if (actIndex > 0) {
    const prev = acts[actIndex - 1];
    if (!prev) return null;
    return { actIndex: actIndex - 1, beatIndex: prev.beats.length - 1 };
  }
  return null;
}
