import { describe, expect, it } from 'vitest';
import { shouldRunGenericPlayback } from './playbackMode';

describe('shouldRunGenericPlayback', () => {
  it('runs only for non-adversarial solver playback', () => {
    expect(shouldRunGenericPlayback({ solvePlayback: false, adversarialPlayback: false })).toBe(false);
    expect(shouldRunGenericPlayback({ solvePlayback: true, adversarialPlayback: false })).toBe(true);
    expect(shouldRunGenericPlayback({ solvePlayback: true, adversarialPlayback: true })).toBe(false);
  });
});
