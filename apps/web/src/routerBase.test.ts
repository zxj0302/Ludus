import { describe, expect, it } from 'vitest';
import { resolveRouterBasename } from './routerBase';

describe('resolveRouterBasename', () => {
  it('does not turn relative shell asset base into a router basename', () => {
    expect(resolveRouterBasename('./')).toBeUndefined();
  });

  it('normalizes deployed path bases without trailing slash', () => {
    expect(resolveRouterBasename('/Ludus/')).toBe('/Ludus');
  });
});
