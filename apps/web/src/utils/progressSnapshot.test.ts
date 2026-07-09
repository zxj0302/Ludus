import { describe, it, expect } from 'vitest';
import { buildProgressSnapshot, computeProgressPercent, getCurrentElapsedMs, timerFieldsForSession } from './progressSnapshot';

describe('buildProgressSnapshot', () => {
  it('captures state, history, and step index', () => {
    const state = { grid: [1, 0], n: 2 };
    const history = [{ grid: [0, 0], n: 2 }, state];
    const snap = buildProgressSnapshot('lights-out', state, history, 1);

    expect(snap.schemaVersion).toBe(1);
    expect(snap.gameId).toBe('lights-out');
    expect(snap.state).toEqual(state);
    expect(snap.moveHistory).toHaveLength(2);
    expect(snap.stepCount).toBe(1);
    expect(snap.timestamp).toBeTruthy();
  });
});

describe('computeProgressPercent', () => {
  it('returns 100 when solved', () => {
    expect(computeProgressPercent(true, 3, 5)).toBe(100);
  });

  it('uses optimal steps ratio when available', () => {
    expect(computeProgressPercent(false, 2, 4)).toBe(50);
  });

  it('falls back to step-based estimate without optimal', () => {
    expect(computeProgressPercent(false, 3, null)).toBe(15);
  });

  it('caps in-progress at 95', () => {
    expect(computeProgressPercent(false, 10, 5)).toBe(95);
  });
});

describe('getCurrentElapsedMs', () => {
  it('uses live delta when timer running', () => {
    const start = Date.now() - 5000;
    expect(getCurrentElapsedMs(start, 0)).toBeGreaterThanOrEqual(5000);
  });

  it('returns frozen elapsed when paused', () => {
    expect(getCurrentElapsedMs(null, 12345)).toBe(12345);
  });
});

describe('timerFieldsForSession', () => {
  const now = 1_000_000;

  it('starts fresh session at zero', () => {
    expect(timerFieldsForSession(false, 0, false, now)).toEqual({
      startTime: now,
      elapsed: 0,
    });
  });

  it('resumes in-progress puzzle with continuous timer', () => {
    expect(timerFieldsForSession(true, 30_000, false, now)).toEqual({
      startTime: now - 30_000,
      elapsed: 30_000,
    });
  });

  it('restores solved puzzle without running timer', () => {
    expect(timerFieldsForSession(true, 45_000, true, now)).toEqual({
      startTime: null,
      elapsed: 45_000,
    });
  });
});
