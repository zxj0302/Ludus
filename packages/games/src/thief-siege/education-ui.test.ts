import { describe, expect, it } from 'vitest';
import { getThiefSiegeTierLabelKey } from './education-ui';

describe('thief-siege education ui helpers', () => {
  it('maps escape-adversary solver stats to visible tier labels', () => {
    expect(getThiefSiegeTierLabelKey('escape-adversary/perfect')).toBe('thiefSiege.ai.tier.perfect');
    expect(getThiefSiegeTierLabelKey('escape-adversary/bounded')).toBe('thiefSiege.ai.tier.bounded');
    expect(getThiefSiegeTierLabelKey('escape-adversary/bfs')).toBe('thiefSiege.ai.tier.bfs');
  });

  it('ignores non thief-siege solver names', () => {
    expect(getThiefSiegeTierLabelKey('BFS (Water Jug)')).toBeNull();
    expect(getThiefSiegeTierLabelKey(undefined)).toBeNull();
  });
});
