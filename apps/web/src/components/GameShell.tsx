import { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { GameState, Move } from '@ludus/core';
import { getGame, getGameEntry } from '@ludus/games';
import type { SokobanState, SokobanMove } from '@ludus/games';
import { generateNimLevelByPreset, generateWythoffLevel } from '@ludus/games';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../stores/gameStore';
import { useSokobanLevels } from '../hooks/useSokobanLevels';
import { GameToolbar, GameStatusBar, ErrorBoundary } from '@ludus/ui';
import { EducationPanel } from './EducationPanel';
import { LevelSelector } from './LevelSelector';
import { stateHash } from '@ludus/games';
import { useSound } from '../hooks/useSound';

interface Props { gameId: string }

export function GameShell({ gameId }: Props) {
  const { t } = useTranslation();
  const { playToggle, playWin, playSolve, playError, playStep, vibrate } = useSound();

  const entry = getGameEntry(gameId);
  const plugin = entry?.plugin ?? getGame(gameId);
  const store = useGameStore(useShallow(s => ({
    gameState: s.gameState,
    applyMove: s.applyMove, undo: s.undo, redo: s.redo, reset: s.reset, newLevel: s.newLevel,
    requestSolve: s.requestSolve, requestHint: s.requestHint,
    solution: s.solution, solverStatus: s.solverStatus, solveError: s.solveError,
    hintMove: s.hintMove, initialOptimalSteps: s.initialOptimalSteps, currentOptimalSteps: s.currentOptimalSteps,
    solvePlayback: s.solvePlayback, solveStepIndex: s.solveStepIndex,
    nextPlaybackStep: s.nextPlaybackStep, prevPlaybackStep: s.prevPlaybackStep, stopPlayback: s.stopPlayback,
    disclosureLevel: s.disclosureLevel, setDisclosureLevel: s.setDisclosureLevel,
    educationOpen: s.educationOpen, setEducationOpen: s.setEducationOpen,
    historyIndex: s.historyIndex, history: s.history,
    startTime: s.startTime, elapsed: s.elapsed, tick: s.tick, pauseTimer: s.pauseTimer,
  })));

  const {
    gameState, applyMove, undo, redo, reset, newLevel,
    requestSolve, requestHint, solution, solverStatus, solveError,
    hintMove, initialOptimalSteps, currentOptimalSteps,
    solvePlayback, solveStepIndex, nextPlaybackStep, prevPlaybackStep, stopPlayback,
    disclosureLevel, setDisclosureLevel, educationOpen, setEducationOpen,
    historyIndex, history, startTime, elapsed, tick,
  } = store;

  // Sokoban 关卡同步需要类型化 state（待 LevelSelector 迁移到 entry 后移除）
  const soState = gameState as unknown as SokobanState | null;
  const isWin: boolean = !solvePlayback && plugin && gameState ? plugin.isSolved(gameState) : false;
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

  const handleMove = useCallback((move: Move) => {
    if (isWin || solvePlayback) return;
    applyMove(move);
    playToggle(); vibrate(5);
  }, [isWin, solvePlayback, applyMove, playToggle, vibrate]);

  // 游戏专属动作分发（Board 组件通过 entry.dispatch 调用）
  const handleDispatch = useCallback((action: { type: string; payload: unknown }) => {
    switch (action.type) {
      case 'loadState':
        useGameStore.getState().loadCustomState(action.payload as GameState);
        break;
      case 'prependHistory':
        useGameStore.setState(s => ({
          history: [action.payload as GameState, ...s.history],
          historyIndex: s.historyIndex + 1,
        }));
        break;
    }
  }, []);

  // 同步侧边栏高度到左侧列，实现底部对齐
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);
  useEffect(() => {
    const el = leftColumnRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setLeftColumnHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 防御：确保 state 与当前游戏匹配（切游戏时的瞬态保护）
  const stateMatchesPlugin = entry ? entry.isOwnState(gameState as GameState) : false;

  if (!plugin || !gameState || !stateMatchesPlugin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-warm-stone-500 animate-pulse">{t('game.loading')}</p>
      </div>
    );
  }

  // 以下 plugin 和 gameState 均非 null，且 state 与 gameId 匹配

  // Sokoban 关卡合集（仅 Sokoban 时加载，避免 Lights Out 等游戏浪费解析）
  const collections = useSokobanLevels(gameId === 'sokoban');
  const [selectedCollection, setSelectedCollection] = useState('builtin');
  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0);
  const loadCustomState = useGameStore(s => s.loadCustomState);
  const [nimDifficulty, setNimDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const currentLevels = collections.find(c => c.name === selectedCollection)?.levels ?? [];
  const totalInCollection = currentLevels.length;

  // 标记"本次状态变更来自关卡选择器"，避免 sync effect 回写覆盖
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

  // 将 LevelSelector 与 loadGame / newLevel 产生的随机状态同步（仅首次或非选择器触发）
  useEffect(() => {
    if (gameId !== 'sokoban' || !soState?.boxes) return;
    if (fromSelector.current) { fromSelector.current = false; return; }
    const currentHash = stateHash(soState as SokobanState);
    for (const coll of collections) {
      const idx = coll.levels.findIndex(l => {
        try { return stateHash(l as unknown as SokobanState) === currentHash; }
        catch { return false; }
      });
      if (idx !== -1) {
        if (coll.name !== selectedCollection) setSelectedCollection(coll.name);
        if (idx !== selectedLevelIdx) setSelectedLevelIdx(idx);
        return;
      }
    }
  }, [gameId, gameState, collections]);

  const handleLevelSelect = useCallback((index: number) => {
    setSelectedLevelIdx(index);
    if (currentLevels[index]) {
      fromSelector.current = true;
      loadCustomState(currentLevels[index] as unknown as Record<string, unknown>);
    }
  }, [currentLevels, loadCustomState]);

  let highlightCell: { row: number; col: number; value?: number } | null = null;

  // 从 move 提取高亮坐标（委托给 entry）

  if (solvePlayback && solution?.moves && entry) {
    highlightCell = entry.moveToHighlight?.(solution.moves[solveStepIndex]! as Move, gameState) ?? null;
  } else if (hintMove && entry) {
    highlightCell = entry.moveToHighlight?.(hintMove, gameState) ?? null;
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

      <div className="flex justify-center items-start">
        {/* 游戏主区域 */}
        <div ref={leftColumnRef} className={`space-y-4 shrink-0 ${educationOpen ? 'lg:w-[55%]' : 'w-full max-w-2xl'}`}>
          <div className="bento-card p-6 text-center">
            <h1 className="text-2xl font-bold text-warm-stone-800">{t(plugin.metadata.nameKey)}</h1>
            <p className="text-sm text-warm-stone-500 mt-1">{t(plugin.metadata.descriptionKey)}</p>
          </div>

          <GameStatusBar
            gameId={gameId}
            stepCount={stepCount} isSolved={isWin} isSolving={solverStatus === 'running'}
            optimalSteps={optimalSteps} remainingSteps={remainingSteps} elapsed={elapsed}
            solvePlayback={solvePlayback} solveStepIndex={solveStepIndex}
            totalSolveSteps={solution?.moves.length ?? 0}
            solveError={solveError}
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
            newLevelSlot={gameId === 'sokoban' ? (
              <LevelSelector
                collections={collections}
                selectedCollection={selectedCollection}
                selectedLevelIdx={selectedLevelIdx}
                totalInCollection={totalInCollection}
                onCollectionChange={handleCollectionChange}
                onLevelSelect={handleLevelSelect}
              />
            ) : gameId === 'nim' ? (
              <div className="flex gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setNimDifficulty(d => d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : 'easy')}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 transition-colors font-medium"
                >
                  {t(`difficulty.${nimDifficulty}`)} ▾
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const level = generateNimLevelByPreset(nimDifficulty);
                    useGameStore.getState().loadCustomState(level.initialState as unknown as Record<string, unknown>);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 transition-colors font-medium"
                >
                  + {t('game.toolbar.new')}
                </button>
              </div>
            ) : gameId === 'wythoff' ? (
              <button
                type="button"
                onClick={() => {
                  const level = generateWythoffLevel();
                  useGameStore.getState().loadCustomState(level.initialState as unknown as Record<string, unknown>);
                }}
                className="text-xs px-2.5 py-1.5 rounded-md bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 transition-colors font-medium"
              >
                + {t('game.toolbar.new')}
              </button>
            ) : undefined}
          />

          <div className="bento-card p-6 flex justify-center min-h-[420px]">
            <ErrorBoundary>
              {entry && gameState ? (
                <entry.BoardComponent
                  state={gameState}
                  onMove={handleMove}
                  disabled={isWin || solvePlayback}
                  highlightCell={highlightCell}
                  dispatch={handleDispatch}
                />
              ) : (
                <p className="text-warm-stone-400 text-sm">{t('game.loading')}</p>
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* 桌面端侧边栏 — 收起时 height:0 防止内容撑高 flex 容器 */}
        <div
          className={`hidden lg:block shrink-0 overflow-hidden
            ${educationOpen ? 'w-[40%]' : 'w-0'}`}
          style={{
            height: !educationOpen ? 0 :
              leftColumnHeight != null ? leftColumnHeight :
              undefined,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              x: educationOpen ? 0 : 30,
              opacity: educationOpen ? 1 : 0,
            }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="lg:sticky lg:top-24 max-h-full overflow-y-auto ml-6"
          >
            <EducationPanel
              gameId={gameId} open={educationOpen}
              onClose={() => setEducationOpen(false)}
              disclosureLevel={disclosureLevel}
              onChangeDisclosureLevel={setDisclosureLevel}
              solution={solution}
              solvePlayback={solvePlayback} solveStepIndex={solveStepIndex}
              gameState={gameState}
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
            gameState={gameState}
          />
        </motion.div>
      </div>
    </div>
  );
}
