import { useCallback } from 'react';
import type { ToolbarSlotProps } from '@ludus/games';
import { DifficultySelector } from '@ludus/ui';
import { useGameStore } from '../stores/gameStore';

/** Default toolbar slot — difficulty preset + regenerate (阶段 6c 关卡设计单元). */
export function GeneratorToolbar({ onNewLevel }: ToolbarSlotProps) {
  const difficultyRange = useGameStore(s => s.difficultyRange);
  const setDifficultyRange = useGameStore(s => s.setDifficultyRange);

  const handlePresetChange = useCallback(
    (range: [number, number]) => {
      setDifficultyRange(range);
      onNewLevel();
    },
    [setDifficultyRange, onNewLevel],
  );

  return (
    <DifficultySelector
      value={difficultyRange}
      onPresetChange={handlePresetChange}
      onGenerate={onNewLevel}
    />
  );
}
