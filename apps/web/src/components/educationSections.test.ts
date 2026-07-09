import { describe, expect, it } from 'vitest';
import { getSectionViewModel } from './EducationPanel';

describe('getSectionViewModel', () => {
  it('marks only the Create education section as generator-capable', () => {
    expect(getSectionViewModel({ key: 'create' }).showCreateLevelControl).toBe(true);
    expect(getSectionViewModel({ key: 'solve' }).showCreateLevelControl).toBe(false);
    expect(getSectionViewModel({ key: 'play' }).showCreateLevelControl).toBe(false);
  });
});
