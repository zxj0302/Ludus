export type EducationStageKey = 'play' | 'think' | 'reveal' | 'solve' | 'create';

export interface ParsedEducationSection {
  key: EducationStageKey;
  english: string;
  chinese: string;
  body: string;
}

export const EDUCATION_STAGE_KEYS: readonly EducationStageKey[] = [
  'play',
  'think',
  'reveal',
  'solve',
  'create',
] as const;

const knownStages = new Set<string>(EDUCATION_STAGE_KEYS);

function normalizeStageKey(heading: string): EducationStageKey | null {
  const englishPart = heading.includes('·')
    ? heading.split('·').pop()!.trim()
    : heading.replace(/^\d+\.\s*/, '').trim();
  const englishLower = englishPart.toLowerCase();

  if (!knownStages.has(englishLower)) return null;
  return englishLower as EducationStageKey;
}

function splitHeading(heading: string): { english: string; chinese: string } {
  const englishPart = heading.includes('·')
    ? heading.split('·').pop()!.trim()
    : heading.replace(/^\d+\.\s*/, '').trim();
  const chinesePart = heading.includes('·')
    ? heading.split('·')[0]!.replace(/^\d+\.\s*/, '').trim()
    : englishPart;

  return { english: englishPart, chinese: chinesePart };
}

/** Parse five-stage markdown sections from raw education content. */
export function splitEducationSections(md: string): ParsedEducationSection[] {
  const sections: ParsedEducationSection[] = [];
  const parts = md.split(/^## /m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf('\n');
    const heading = newlineIdx >= 0 ? part.slice(0, newlineIdx).trim() : part.trim();
    const body = newlineIdx >= 0 ? part.slice(newlineIdx + 1).trim() : '';
    const key = normalizeStageKey(heading);

    if (!key || !body) continue;

    const { english, chinese } = splitHeading(heading);
    sections.push({ key, english, chinese, body });
  }

  return sections;
}
