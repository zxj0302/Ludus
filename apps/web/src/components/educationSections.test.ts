import { describe, expect, it } from 'vitest';
import { getSectionViewModel } from './educationSectionViewModel';

describe('getSectionViewModel', () => {
  it('marks only the Create education section for a design-principle callout', () => {
    expect(getSectionViewModel({ key: 'create' }).showCreateDesignCallout).toBe(true);
    expect(getSectionViewModel({ key: 'solve' }).showCreateDesignCallout).toBe(false);
    expect(getSectionViewModel({ key: 'play' }).showCreateDesignCallout).toBe(false);
  });
});
