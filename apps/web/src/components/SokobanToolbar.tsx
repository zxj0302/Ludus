import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SokobanState } from '@ludus/games';
import { stateHash } from '@ludus/games';
import { useSokobanLevels } from '../hooks/useSokobanLevels';
import { useGameStore } from '../stores/gameStore';
import { LevelSelector } from './LevelSelector';

interface Props {
  onNewLevel: () => void;
}

export function SokobanToolbar({ onNewLevel: _onNewLevel }: Props) {
  const { t } = useTranslation();
  const collections = useSokobanLevels(true);
  const [selectedCollection, setSelectedCollection] = useState('builtin');
  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0);
  const loadCustomState = useGameStore(s => s.loadCustomState);
  const gameState = useGameStore(s => s.gameState);
  const currentLevels = collections.find(c => c.name === selectedCollection)?.levels ?? [];
  const totalInCollection = currentLevels.length;
  const fromSelector = useRef(false);

  const handleCollectionChange = useCallback((name: string) => {
    setSelectedCollection(name);
    setSelectedLevelIdx(0);
    const coll = collections.find(c => c.name === name);
    if (coll && coll.levels.length > 0) {
      fromSelector.current = true;
      loadCustomState(coll.levels[0] as unknown as Record<string, unknown>);
    }
  }, [collections, loadCustomState]);

  useEffect(() => {
    const soState = gameState as unknown as SokobanState | null;
    if (!soState?.boxes) return;
    if (fromSelector.current) { fromSelector.current = false; return; }
    const currentHash = stateHash(soState);
    for (const coll of collections) {
      const idx = coll.levels.findIndex(l => {
        try { return stateHash(l) === currentHash; }
        catch { return false; }
      });
      if (idx !== -1) {
        if (coll.name !== selectedCollection) setSelectedCollection(coll.name);
        if (idx !== selectedLevelIdx) setSelectedLevelIdx(idx);
        return;
      }
    }
  }, [gameState, collections]);

  const handleLevelSelect = useCallback((index: number) => {
    setSelectedLevelIdx(index);
    if (currentLevels[index]) {
      fromSelector.current = true;
      loadCustomState(currentLevels[index] as unknown as Record<string, unknown>);
    }
  }, [currentLevels, loadCustomState]);

  return (
    <LevelSelector
      collections={collections}
      selectedCollection={selectedCollection}
      selectedLevelIdx={selectedLevelIdx}
      totalInCollection={totalInCollection}
      onCollectionChange={handleCollectionChange}
      onLevelSelect={handleLevelSelect}
    />
  );
}
