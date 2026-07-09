import { useCallback, useState } from 'react';
import type { ToolbarSlotProps } from '@ludus/games';
import { DifficultySelector } from '@ludus/ui';
import { useGameStore } from '../stores/gameStore';
import { getGeneratorControlSpec } from '../generatorControls';
import { AdvancedGeneratorToolbarPanel } from './AdvancedGeneratorToolbarPanel';

/** Default toolbar slot — difficulty preset + regenerate (阶段 6c 关卡设计单元). */
export function GeneratorToolbar({ onNewLevel }: ToolbarSlotProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const gameId = useGameStore(s => s.gameId);
  const difficultyRange = useGameStore(s => s.difficultyRange);
  const setDifficultyRange = useGameStore(s => s.setDifficultyRange);
  const supportsAdvancedGeneration = getGeneratorControlSpec(gameId) != null;

  const handlePresetChange = useCallback(
    (range: [number, number]) => {
      setDifficultyRange(range);
      onNewLevel();
    },
    [setDifficultyRange, onNewLevel],
  );

  return (
    <div className="space-y-2">
      <DifficultySelector
        value={difficultyRange}
        onPresetChange={handlePresetChange}
        onGenerate={onNewLevel}
        onAdvancedSelect={supportsAdvancedGeneration ? () => setAdvancedOpen(open => !open) : undefined}
        advancedLabelKey={advancedOpen ? 'generator.advanced.hide' : 'generator.advanced.show'}
        showAdvancedUnavailable={!supportsAdvancedGeneration}
      />

      {supportsAdvancedGeneration && advancedOpen && <AdvancedGeneratorToolbarPanel />}
    </div>
  );
}
