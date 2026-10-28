import { useTranslation } from 'react-i18next';

interface Props {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onNewLevel: () => void;
  onSolve: () => void;
  onHint: () => void;
  onStopPlayback: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSolving: boolean;
  isSolved: boolean;
  solvePlayback: boolean;
  hasHint: boolean;
  /** 对抗游戏自动播放时禁用手动步进 */
  adversarialPlayback?: boolean;
  /** 替换"+新关卡"按钮的内容 */
  newLevelSlot?: React.ReactNode;
}

function Btn({ onClick, disabled, children, accent }: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  accent?: 'primary' | 'hint' | undefined;
}) {
  let cls = 'px-4 py-2 rounded-btn text-sm font-medium transition-all duration-150 active:scale-[0.97] ';
  if (accent === 'primary') {
    cls += 'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 shadow-sm disabled:bg-logic-indigo-300';
  } else if (accent === 'hint') {
    cls += 'bg-game-amber-400 text-game-amber-800 hover:bg-game-amber-500 shadow-sm';
  } else {
    cls += 'bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 disabled:opacity-40';
  }
  return <button type="button" disabled={disabled} onClick={onClick} className={cls}>{children}</button>;
}

export function GameToolbar({
  onUndo, onRedo, onReset, onNewLevel, onSolve, onHint,
  onStopPlayback, onPrevStep, onNextStep,
  canUndo, canRedo, isSolving, isSolved,
  solvePlayback, hasHint, newLevelSlot, adversarialPlayback,
}: Props) {
  const { t } = useTranslation();

  if (solvePlayback) {
    const stepDisabled = !!adversarialPlayback;
    return (
      <div className="bento-card p-3 flex items-center justify-center gap-2 flex-wrap">
        <Btn onClick={onPrevStep} disabled={stepDisabled}>◀</Btn>
        <Btn onClick={onNextStep} disabled={stepDisabled}>▶ {t('game.toolbar.nextStep')}</Btn>
        <div className="w-px h-5 bg-warm-stone-200 mx-1" />
        <Btn onClick={onStopPlayback}>■ {t('game.toolbar.stopPlayback')}</Btn>
      </div>
    );
  }

  return (
    <div className="bento-card p-3 flex items-center justify-center gap-2 flex-wrap">
      <Btn onClick={onUndo} disabled={!canUndo}>↩ {t('game.toolbar.undo')}</Btn>
      <Btn onClick={onRedo} disabled={!canRedo}>↪ {t('game.toolbar.redo')}</Btn>
      <Btn onClick={onReset}>⟳ {t('game.toolbar.reset')}</Btn>
      {newLevelSlot !== undefined ? (
        newLevelSlot ? (
          <>
            <div className="w-px h-5 bg-warm-stone-200 mx-1" />
            {newLevelSlot}
          </>
        ) : null
      ) : (
        <>
          <div className="w-px h-5 bg-warm-stone-200 mx-1" />
          <Btn onClick={onNewLevel}>+ {t('game.toolbar.new')}</Btn>
        </>
      )}

      <div className="w-px h-5 bg-warm-stone-200 mx-1" />

      <Btn onClick={onHint} disabled={isSolving || isSolved} accent="hint">
        💡 {t('game.toolbar.hint')}
      </Btn>

      <Btn onClick={onSolve} disabled={isSolving || isSolved} accent="primary">
        {isSolving ? '…' : '⚡'} {t('game.toolbar.solve')}
      </Btn>
    </div>
  );
}
