import { describe, expect, it } from 'vitest';
import { canAdvanceDemo, demoAdvanceBlockReason } from './demoAdvanceGate';

const base = {
  isLast: false,
  playSatisfied: false,
  sideEffectArmed: true,
  solverStatus: 'idle' as const,
  solvePlayback: false,
};

describe('canAdvanceDemo', () => {
  it('blocks on the last beat', () => {
    expect(canAdvanceDemo({ ...base, beatType: 'reveal', isLast: true })).toBe(false);
    expect(demoAdvanceBlockReason({ ...base, beatType: 'reveal', isLast: true })).toBe('last');
  });

  it('allows speak and reveal immediately', () => {
    expect(canAdvanceDemo({ ...base, beatType: 'speak' })).toBe(true);
    expect(canAdvanceDemo({ ...base, beatType: 'reveal' })).toBe(true);
  });

  it('gates play until satisfied', () => {
    expect(canAdvanceDemo({ ...base, beatType: 'play' })).toBe(false);
    expect(demoAdvanceBlockReason({ ...base, beatType: 'play' })).toBe('play');
    expect(canAdvanceDemo({ ...base, beatType: 'play', playSatisfied: true })).toBe(true);
  });

  it('gates hint until armed and not running', () => {
    expect(canAdvanceDemo({ ...base, beatType: 'hint', sideEffectArmed: false })).toBe(false);
    expect(canAdvanceDemo({ ...base, beatType: 'hint', solverStatus: 'running' })).toBe(false);
    expect(canAdvanceDemo({ ...base, beatType: 'hint', solverStatus: 'done' })).toBe(true);
    expect(canAdvanceDemo({ ...base, beatType: 'hint', solverStatus: 'idle' })).toBe(true);
  });

  it('gates solve until armed, idle, and playback finished', () => {
    expect(canAdvanceDemo({ ...base, beatType: 'solve', sideEffectArmed: false })).toBe(false);
    expect(canAdvanceDemo({ ...base, beatType: 'solve', solverStatus: 'running' })).toBe(false);
    expect(canAdvanceDemo({
      ...base,
      beatType: 'solve',
      solverStatus: 'done',
      solvePlayback: true,
    })).toBe(false);
    expect(demoAdvanceBlockReason({
      ...base,
      beatType: 'solve',
      solverStatus: 'done',
      solvePlayback: true,
    })).toBe('solve');
    expect(canAdvanceDemo({
      ...base,
      beatType: 'solve',
      solverStatus: 'done',
      solvePlayback: false,
    })).toBe(true);
  });
});
