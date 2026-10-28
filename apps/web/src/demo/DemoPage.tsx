import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { parseDemoPlaylist, type DemoBeat } from '@ludus/core/schemas';
import { useGameStore } from '../stores/gameStore';
import { clearSolverRuntimeTimers } from '../stores/gameStoreSolverRuntime';
import { GameShell } from '../components/GameShell';
import chiCorePlaylist from './chi-core.json';
import { findVizBeatIndex, nextDemoCursor, prevDemoCursor } from './demoNavigation';
import { canAdvanceDemo, demoAdvanceBlockReason } from './demoAdvanceGate';
import { DemoVizPane } from './DemoVizPane';

export function DemoPage() {
  const { t } = useTranslation();
  const playlist = useMemo(() => parseDemoPlaylist(chiCorePlaylist), []);
  const [actIndex, setActIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [playSkipped, setPlaySkipped] = useState(false);
  const [playBaselineHistory, setPlayBaselineHistory] = useState(0);
  const [sideEffectArmed, setSideEffectArmed] = useState(false);
  const initialLangRef = useRef(useGameStore.getState().language);
  const appliedBeatKeyRef = useRef<string | null>(null);

  const loadDemoAct = useGameStore(s => s.loadDemoAct);
  const setLanguage = useGameStore(s => s.setLanguage);
  const requestHint = useGameStore(s => s.requestHint);
  const requestSolve = useGameStore(s => s.requestSolve);
  const stopPlayback = useGameStore(s => s.stopPlayback);
  const reset = useGameStore(s => s.reset);
  const setEducationOpen = useGameStore(s => s.setEducationOpen);
  const setDisclosureLevel = useGameStore(s => s.setDisclosureLevel);
  const storeGameId = useGameStore(s => s.gameId);
  const gameState = useGameStore(s => s.gameState);
  const history = useGameStore(s => s.history);
  const historyIndex = useGameStore(s => s.historyIndex);
  const solverStatus = useGameStore(s => s.solverStatus);
  const solvePlayback = useGameStore(s => s.solvePlayback);
  const solution = useGameStore(s => s.solution);
  const solveStepIndex = useGameStore(s => s.solveStepIndex);

  const act = playlist.acts[actIndex];
  const totalBeats = act?.beats.length ?? 0;
  const safeBeatIndex = act ? Math.min(beatIndex, Math.max(0, totalBeats - 1)) : 0;
  const beat = act?.beats[safeBeatIndex];
  const stageVizOpen = beat?.type === 'solve' || beat?.type === 'reveal';

  useEffect(() => {
    const previousLang = initialLangRef.current;
    setLanguage(playlist.defaultLocale);
    return () => {
      clearSolverRuntimeTimers();
      setLanguage(previousLang);
    };
  }, [playlist.defaultLocale, setLanguage]);

  useEffect(() => {
    if (!act) return;
    appliedBeatKeyRef.current = null;
    loadDemoAct(act.gameId, act.level);
  }, [act, loadDemoAct, actIndex]);

  useEffect(() => {
    if (totalBeats > 0 && beatIndex >= totalBeats) {
      setBeatIndex(0);
    }
  }, [totalBeats, beatIndex]);

  useEffect(() => {
    setPlaySkipped(false);
    setPlayBaselineHistory(useGameStore.getState().historyIndex);
    setSideEffectArmed(false);
  }, [actIndex, safeBeatIndex]);

  const applyBeatSideEffects = useCallback((b: DemoBeat) => {
    // Demo uses Stage R instead of EducationPanel.
    setEducationOpen(false);
    if (b.type !== 'solve' && b.type !== 'reveal' && useGameStore.getState().solvePlayback) {
      stopPlayback();
    }
    switch (b.type) {
      case 'hint':
        requestHint();
        setSideEffectArmed(true);
        break;
      case 'solve':
        // Ensure fast solvers attach solution/trace for Stage R.
        setDisclosureLevel(2);
        requestSolve();
        setSideEffectArmed(true);
        break;
      case 'reveal': {
        setDisclosureLevel(2);
        const cur = useGameStore.getState();
        const prevSol = cur.solution;
        const prevStatus = cur.solverStatus;
        // Restore initial level so Stage R can drive the board (esp. LO bidirectional).
        reset();
        if (!cur.plugin?.metadata.isFastSolver && prevSol) {
          useGameStore.setState({ solution: prevSol, solverStatus: prevStatus });
        }
        setSideEffectArmed(true);
        break;
      }
      default:
        setSideEffectArmed(true);
        break;
    }
  }, [requestHint, requestSolve, reset, setDisclosureLevel, setEducationOpen, stopPlayback]);

  useEffect(() => {
    if (!beat || !act || storeGameId !== act.gameId || !gameState) return;
    const beatKey = `${actIndex}:${safeBeatIndex}`;
    if (appliedBeatKeyRef.current === beatKey) return;
    appliedBeatKeyRef.current = beatKey;
    applyBeatSideEffects(beat);
  }, [beat, applyBeatSideEffects, act, storeGameId, gameState, actIndex, safeBeatIndex]);

  const goNext = () => {
    const next = nextDemoCursor(playlist.acts, actIndex, safeBeatIndex);
    if (!next) return;
    setActIndex(next.actIndex);
    setBeatIndex(next.beatIndex);
  };

  const goPrev = () => {
    const prev = prevDemoCursor(playlist.acts, actIndex, safeBeatIndex);
    if (!prev) return;
    setActIndex(prev.actIndex);
    setBeatIndex(prev.beatIndex);
  };

  const skipToViz = () => {
    if (!act) return;
    const idx = findVizBeatIndex(act.beats);
    if (idx == null) return;
    setBeatIndex(idx);
  };

  if (!act || !beat) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-warm-stone-500">
        {t('demo.invalid')}
        <div className="mt-4">
          <Link to="/" className="text-logic-indigo-600 font-semibold">{t('demo.exit')}</Link>
        </div>
      </div>
    );
  }

  const ready = storeGameId === act.gameId && !!gameState;
  const isLast = actIndex === playlist.acts.length - 1 && safeBeatIndex === totalBeats - 1;
  const prependedChoosingTurn =
    playBaselineHistory === 0
    && (history[0] as { phase?: string } | undefined)?.phase === 'choosing';
  const requiredHistoryIndex = playBaselineHistory + (prependedChoosingTurn ? 1 : 0);
  const playSatisfied = playSkipped || historyIndex > requiredHistoryIndex;
  const gateInput = {
    beatType: beat.type,
    isLast,
    playSatisfied,
    sideEffectArmed,
    solverStatus,
    solvePlayback,
  };
  const nextEnabled = canAdvanceDemo(gateInput);
  const blockReason = demoAdvanceBlockReason(gateInput);
  const vizBeatIndex = findVizBeatIndex(act.beats);
  const canSkipToViz =
    vizBeatIndex != null
    && safeBeatIndex < vizBeatIndex
    && (beat.type === 'speak' || beat.type === 'play' || beat.type === 'hint');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-logic-indigo-200 bg-logic-indigo-50 px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-logic-indigo-800">
          <span className="font-bold">{t(playlist.titleKey)}</span>
          <span>
            {t('demo.progress', {
              act: actIndex + 1,
              acts: playlist.acts.length,
              beat: safeBeatIndex + 1,
              beats: totalBeats,
            })}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-logic-indigo-600">
          {t(act.titleKey)}
        </p>
        <p className="text-base text-warm-stone-800 leading-relaxed">
          {t(beat.narrationKey)}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={actIndex === 0 && safeBeatIndex === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-warm-stone-200
                       text-warm-stone-700 disabled:opacity-40 hover:bg-warm-stone-50"
          >
            {t('demo.prev')}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!nextEnabled}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-logic-indigo-600 text-white
                       disabled:opacity-40 hover:bg-logic-indigo-700"
          >
            {isLast ? t('demo.done') : t('demo.next')}
          </button>
          {beat.type === 'play' && !playSatisfied && (
            <button
              type="button"
              onClick={() => setPlaySkipped(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-logic-indigo-200
                         text-logic-indigo-700 hover:bg-logic-indigo-100"
            >
              {t('demo.skipPlay')}
            </button>
          )}
          {canSkipToViz && (
            <button
              type="button"
              onClick={skipToViz}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-logic-indigo-200
                         text-logic-indigo-700 hover:bg-logic-indigo-100"
            >
              {t('demo.stage.skipToViz')}
            </button>
          )}
          <Link
            to="/"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-warm-stone-600 hover:text-warm-stone-800"
          >
            {t('demo.exit')}
          </Link>
        </div>
        {blockReason === 'play' && (
          <p className="text-xs text-logic-indigo-700">{t('demo.waitPlay')}</p>
        )}
        {blockReason === 'hint' && (
          <p className="text-xs text-logic-indigo-700">{t('demo.waitHint')}</p>
        )}
        {blockReason === 'solve' && (
          <p className="text-xs text-logic-indigo-700">{t('demo.waitSolve')}</p>
        )}
      </div>

      {!ready ? (
        <p className="text-center text-warm-stone-500 animate-pulse py-16">{t('game.loading')}</p>
      ) : (
        <div
          className={`flex flex-col gap-4 ${
            stageVizOpen ? 'lg:flex-row lg:items-stretch' : ''
          }`}
        >
          <div className={stageVizOpen ? 'lg:w-[58%] min-w-0' : 'w-full'}>
            <GameShell gameId={act.gameId} variant="demo" />
          </div>
          {stageVizOpen && gameState && (
            <div className="lg:w-[42%] min-w-0">
              <DemoVizPane
                gameId={act.gameId}
                gameState={gameState}
                solution={solution}
                solvePlayback={solvePlayback}
                solveStepIndex={solveStepIndex}
                solverStatus={solverStatus}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
