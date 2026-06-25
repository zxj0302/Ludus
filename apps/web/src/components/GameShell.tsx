import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { getGame, LightsOutBoard } from '@ludus/games';
import type { LightsOutState, LightsOutMove } from '@ludus/games';
import { GameToolbar } from './GameToolbar';
import { GameStatusBar } from './GameStatusBar';
import { EducationPanel } from './EducationPanel';
import { useSound } from '../hooks/useSound';

interface Props { gameId: string }

export function GameShell({ gameId }: Props) {
  const { t } = useTranslation();
  const { playToggle, playWin, playSolve, playError, playStep, vibrate } = useSound();

  const plugin = getGame(gameId);
  const store = useGameStore(s => ({
    gameState: s.gameState,
    applyMove: s.applyMove, undo: s.undo, redo: s.redo, reset: s.reset, newLevel: s.newLevel,
    requestSolve: s.requestSolve, requestHint: s.requestHint,
    solution: s.solution, solverStatus: s.solverStatus,
    hintMove: s.hintMove, initialOptimalSteps: s.initialOptimalSteps, currentOptimalSteps: s.currentOptimalSteps,
    solvePlayback: s.solvePlayback, solveStepIndex: s.solveStepIndex,
    nextPlaybackStep: s.nextPlaybackStep, prevPlaybackStep: s.prevPlaybackStep, stopPlayback: s.stopPlayback,
    disclosureLevel: s.disclosureLevel, setDisclosureLevel: s.setDisclosureLevel,
    educationOpen: s.educationOpen, setEducationOpen: s.setEducationOpen,
    historyIndex: s.historyIndex, history: s.history,
    startTime: s.startTime, elapsed: s.elapsed, tick: s.tick,
  }));

  // 解构引用（从单一 selector 读取，避免多次订阅）
  const {
    gameState, applyMove, undo, redo, reset, newLevel,
    requestSolve, requestHint, solution, solverStatus,
    hintMove, initialOptimalSteps, currentOptimalSteps,
    solvePlayback, solveStepIndex, nextPlaybackStep, prevPlaybackStep, stopPlayback,
    disclosureLevel, setDisclosureLevel, educationOpen, setEducationOpen,
    historyIndex, history, startTime, elapsed, tick,
  } = store;

  const loState = gameState as unknown as LightsOutState | null;
  const isWin: boolean = loState && !solvePlayback && plugin ? plugin.isSolved(gameState!) : false;
  const stepCount = historyIndex;
  const optimalSteps = initialOptimalSteps;
  const remainingSteps = currentOptimalSteps;

  useEffect(() => {
    if (!startTime || isWin) return;
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [startTime, tick, isWin]);

  useEffect(() => {
    if (solution?.solvable && solverStatus === 'done' && solution.moves.length > 0) {
      playSolve(); vibrate(20);
    }
    if (solution && !solution.solvable) playError();
  }, [solution, solverStatus, playSolve, playError, vibrate]);

  useEffect(() => {
    if (isWin && historyIndex > 0) { playWin(); vibrate(30); }
  }, [isWin, historyIndex, playWin, vibrate]);

  useEffect(() => {
    if (!solvePlayback) return;
    const timer = setInterval(() => { playStep(); nextPlaybackStep(); }, 600);
    return () => clearInterval(timer);
  }, [solvePlayback, nextPlaybackStep, playStep]);

  const handleMove = useCallback((move: LightsOutMove) => {
    if (isWin || solvePlayback) return;
    applyMove(move);
    playToggle(); vibrate(5);
  }, [isWin, solvePlayback, applyMove, playToggle, vibrate]);

  if (!plugin || !gameState || !loState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-warm-stone-500 animate-pulse">{t('game.loading')}</p>
      </div>
    );
  }

  let highlightCell: { row: number; col: number } | null = null;
  if (solvePlayback && solution?.moves) {
    const m = solution.moves[solveStepIndex];
    if (m) highlightCell = { row: (m as LightsOutMove).row, col: (m as LightsOutMove).col };
  } else if (hintMove) {
    highlightCell = hintMove;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 relative">
      {/* 书签式侧边栏开关 — 固定在窗口右侧中部 */}
      <button
        type="button"
        onClick={() => {
          if (!educationOpen) setDisclosureLevel(2);
          setEducationOpen(!educationOpen);
        }}
        className={`
          fixed right-0 top-1/2 -translate-y-1/2 z-30
          flex items-center gap-1.5
          py-3 pl-3 pr-2
          rounded-l-xl shadow-lg
          text-xs font-semibold
          transition-all duration-300 ease-in-out
          ${educationOpen
            ? 'bg-warm-stone-200 text-warm-stone-600 hover:bg-warm-stone-300'
            : 'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700'}
        `}
        style={{ writingMode: 'vertical-rl' }}
        title={educationOpen ? t('game.toolbar.sidebarClose') : t('game.toolbar.sidebar')}
        aria-label={educationOpen ? t('game.toolbar.sidebarClose') : t('game.toolbar.sidebar')}
      >
        {educationOpen ? t('game.toolbar.sidebarClose') : t('game.toolbar.sidebar')}
      </button>

      <div className="flex justify-center">
        {/* 游戏主区域 — 宽度瞬时切换（不参与 transition，避免 layout thrash） */}
        <div className={`space-y-4 shrink-0 ${educationOpen ? 'lg:w-[55%]' : 'w-full max-w-2xl'}`}>
          <div className="bento-card p-6 text-center">
            <h1 className="text-2xl font-bold text-warm-stone-800">{t(plugin.metadata.nameKey)}</h1>
            <p className="text-sm text-warm-stone-500 mt-1">{t(plugin.metadata.descriptionKey)}</p>
          </div>

          <GameStatusBar
            stepCount={stepCount} isSolved={isWin} isSolving={solverStatus === 'running'}
            optimalSteps={optimalSteps} remainingSteps={remainingSteps} elapsed={elapsed}
            solvePlayback={solvePlayback} solveStepIndex={solveStepIndex}
            totalSolveSteps={solution?.moves.length ?? 0}
          />

          <GameToolbar
            onUndo={undo} onRedo={redo} onReset={reset} onNewLevel={newLevel}
            onSolve={requestSolve} onHint={requestHint}
            onStopPlayback={stopPlayback}
            onPrevStep={prevPlaybackStep} onNextStep={nextPlaybackStep}
            canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
            isSolving={solverStatus === 'running'} isSolved={isWin}
            solvePlayback={solvePlayback}
            hasHint={!!hintMove}
          />

          <div className="bento-card p-6 flex justify-center">
            <LightsOutBoard
              state={loState} onMove={handleMove}
              disabled={isWin || solvePlayback} highlightCell={highlightCell}
            />
          </div>
        </div>

        {/* 桌面端侧边栏 — transform 滑入 + opacity（GPU 合成，不触发 layout reflow） */}
        <div
          className={`hidden lg:block shrink-0 overflow-hidden
            ${educationOpen ? 'w-[40%]' : 'w-0'}`}
        >
          <motion.div
            initial={false}
            animate={{
              x: educationOpen ? 0 : 30,
              opacity: educationOpen ? 1 : 0,
            }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto ml-6"
          >
            <EducationPanel
              gameId={gameId} open={educationOpen}
              onClose={() => setEducationOpen(false)}
              disclosureLevel={disclosureLevel}
              onChangeDisclosureLevel={setDisclosureLevel}
              solution={solution}
              solvePlayback={solvePlayback} solveStepIndex={solveStepIndex}
              gameState={loState}
            />
          </motion.div>
        </div>

        {/* 移动端：侧边栏作为全屏覆盖层 — translateX 滑入 */}
        <motion.div
          initial={false}
          animate={{
            x: educationOpen ? 0 : '100%',
          }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="fixed inset-0 top-16 z-20 bg-white overflow-y-auto lg:hidden"
        >
          <EducationPanel
            gameId={gameId} open={educationOpen}
            onClose={() => setEducationOpen(false)}
            disclosureLevel={disclosureLevel}
            onChangeDisclosureLevel={setDisclosureLevel}
            solution={solution}
            solvePlayback={solvePlayback} solveStepIndex={solveStepIndex}
            gameState={loState}
          />
        </motion.div>
      </div>
    </div>
  );
}
