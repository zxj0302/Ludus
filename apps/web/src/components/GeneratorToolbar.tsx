import { useCallback, useState } from 'react';
import type { ToolbarSlotProps } from '@ludus/games';
import { DifficultySelector } from '@ludus/ui';
import { useGameStore } from '../stores/gameStore';
import { getGeneratorControlSpec } from '../generatorControls';
import { getDifficultyRangeForGame } from '../stores/gameStoreLevelGeneration';
import { AdvancedGeneratorToolbarPanel } from './AdvancedGeneratorToolbarPanel';

/** Default toolbar slot — difficulty preset + regenerate (阶段 6c 关卡设计单元). */
export function GeneratorToolbar({ onNewLevel }: ToolbarSlotProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const gameId = useGameStore(s => s.gameId);
  const difficultyRangeByGame = useGameStore(s => s.difficultyRangeByGame);
  const difficultyRange = getDifficultyRangeForGame(difficultyRangeByGame, gameId);
  const setDifficultyRange = useGameStore(s => s.setDifficultyRange);
  const newLevel = useGameStore(s => s.newLevel);
  const supportsAdvancedGeneration = getGeneratorControlSpec(gameId) != null;

  const handlePresetChange = useCallback(
    (range: [number, number]) => {
      setDifficultyRange(range);
      // Pass range explicitly so generation never races the store write.
      newLevel({ difficultyRange: range });
    },
    [setDifficultyRange, newLevel],
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
