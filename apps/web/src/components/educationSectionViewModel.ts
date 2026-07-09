export function getSectionViewModel(section: { key: string }): { showCreateDesignCallout: boolean } {
  return { showCreateDesignCallout: section.key === 'create' };
}
