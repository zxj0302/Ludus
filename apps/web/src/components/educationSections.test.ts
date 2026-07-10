import { describe, expect, it } from 'vitest';
import { getSectionViewModel } from './educationSectionViewModel';
import { splitEducationSections } from './educationSectionParser';

describe('getSectionViewModel', () => {
  it('marks only the Create education section for a design-principle callout', () => {
    expect(getSectionViewModel({ key: 'create' }).showCreateDesignCallout).toBe(true);
    expect(getSectionViewModel({ key: 'solve' }).showCreateDesignCallout).toBe(false);
    expect(getSectionViewModel({ key: 'play' }).showCreateDesignCallout).toBe(false);
  });
});

describe('splitEducationSections integration', () => {
  it('feeds parsed sections into section view models', () => {
    const sections = splitEducationSections('## 5. 出题 · Create\nBody');
    expect(getSectionViewModel(sections[0]!).showCreateDesignCallout).toBe(true);
  });
});
