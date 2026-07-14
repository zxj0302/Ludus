import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  catalogByGoal,
  entryToState,
  type PegCatalogEntry,
  type PegGoal,
  type PegSolitaireState,
} from '@ludus/games';
import type { Collection } from '../types/levelCollection';
import { useGameStore } from '../stores/gameStore';
import { LevelSelector } from './LevelSelector';

interface Props {
  onNewLevel: () => void;
}

function optimalForEntry(entry: PegCatalogEntry): number {
  // Singleton goals: every complete single-jump solution has length popcount - 1.
  if (entry.knownSolutionLength != null) return entry.knownSolutionLength;
  let n = 0;
  for (let h = 0; h < 33; h += 1) {
    if ((entry.pegs & (2 ** h)) !== 0) n += 1;
  }
  return Math.max(0, n - 1);
}

export function PegSolitaireToolbar({ onNewLevel: _onNewLevel }: Props) {
  const { t } = useTranslation();
  const loadCustomState = useGameStore(s => s.loadCustomState);
  const gameState = useGameStore(s => s.gameState);
  const [selectedMode, setSelectedMode] = useState<PegGoal>('one-center');
  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0);
  const fromSelector = useRef(false);

  const collections = useMemo((): Collection<PegSolitaireState>[] => [
    {
      name: 'one-any',
      label: t('pegSolitaire.mode.one-any'),
      shortLabel: t('pegSolitaire.mode.one-any'),
      levels: catalogByGoal('one-any').map(entryToState),
    },
    {
      name: 'one-center',
      label: t('pegSolitaire.mode.one-center'),
      shortLabel: t('pegSolitaire.mode.one-center'),
      levels: catalogByGoal('one-center').map(entryToState),
    },
  ], [t]);

  const currentLevels = collections.find(c => c.name === selectedMode)?.levels ?? [];
  const catalogEntries = useMemo(() => catalogByGoal(selectedMode), [selectedMode]);

  const loadEntry = useCallback((entry: PegCatalogEntry) => {
    fromSelector.current = true;
    loadCustomState(
      entryToState(entry) as unknown as Record<string, unknown>,
      { optimalSteps: optimalForEntry(entry) },
    );
  }, [loadCustomState]);

  const handleModeChange = useCallback((name: string) => {
    const mode = name as PegGoal;
    setSelectedMode(mode);
    setSelectedLevelIdx(0);
    const entry = catalogByGoal(mode)[0];
    if (!entry) return;
    loadEntry(entry);
  }, [loadEntry]);

  const handleLevelSelect = useCallback((index: number) => {
    setSelectedLevelIdx(index);
    const entry = catalogByGoal(selectedMode)[index];
    if (!entry) return;
    loadEntry(entry);
  }, [loadEntry, selectedMode]);

  useEffect(() => {
    const peg = gameState as PegSolitaireState | null;
    if (!peg || typeof peg.pegs !== 'number') return;
    if (fromSelector.current) {
      fromSelector.current = false;
      return;
    }

    for (const mode of ['one-any', 'one-center'] as const) {
      const pool = catalogByGoal(mode);
      const idx = pool.findIndex(entry =>
        entry.id === peg.catalogId || (entry.pegs === peg.pegs && entry.goal === peg.goal),
      );
      if (idx === -1) continue;
      if (mode !== selectedMode) setSelectedMode(mode);
      if (idx !== selectedLevelIdx) setSelectedLevelIdx(idx);
      return;
    }
  }, [gameState, selectedMode, selectedLevelIdx]);

  return (
    <LevelSelector
      collections={collections}
      selectedCollection={selectedMode}
      selectedLevelIdx={selectedLevelIdx}
      totalInCollection={currentLevels.length}
      onCollectionChange={handleModeChange}
      onLevelSelect={handleLevelSelect}
      collectionLabelKey="pegSolitaire.modeLabel"
      formatLevelOption={(index) => {
        const entry = catalogEntries[index];
        if (!entry) return `${index + 1}`;
        return `${index + 1}. ${t(entry.titleKey)}`;
      }}
    />
  );
}
