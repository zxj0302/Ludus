import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GameState, Solution, SolverTrace } from '@ludus/core';
import { getGameEntry } from '@ludus/games';
import { ErrorBoundary } from '@ludus/ui';
import { StatusCard } from '../statusCards';
import { getPlayerStarts } from '../utils/solution';

const MAX_STEPS = 8;

interface Props {
  gameId: string;
  gameState: GameState;
  solution: Solution | null;
  solvePlayback: boolean;
  solveStepIndex: number;
  solverStatus: 'idle' | 'running' | 'done';
}

/** CHI Demo Stage R — live analysis only (no Markdown teaching). */
export function DemoVizPane({
  gameId,
  gameState,
  solution,
  solvePlayback,
  solveStepIndex,
  solverStatus,
}: Props) {
  const { t } = useTranslation();
  const entry = getGameEntry(gameId);
  const VizComponent = entry?.visualization?.Component;
  const matchTrace = entry?.visualization?.matchTrace;
  const trace = solution?.trace as SolverTrace | undefined;
  const showViz = !!(VizComponent && matchTrace && trace && matchTrace(trace));
  const moves = solution?.solvable ? solution.moves : [];
  const visibleMoves = moves.slice(0, MAX_STEPS);
  const playersFirst = getPlayerStarts(solution);
  const solving = solverStatus === 'running';

  return (
    <div className="bento-card overflow-hidden h-full min-h-[360px] flex flex-col border-warm-stone-200">
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-warm-stone-100"
        style={{ borderLeft: '4px solid var(--sky-blue-600)', backgroundColor: 'var(--sky-blue-50)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--sky-blue-700)' }}>
          {t('demo.stage.vizTitle')}
        </h3>
        <Link
          to={`/game/${gameId}`}
          className="text-xs font-semibold text-logic-indigo-600 hover:text-logic-indigo-800 shrink-0"
        >
          {t('demo.stage.readInHub')}
        </Link>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <ErrorBoundary>
          <StatusCard gameId={gameId} gameState={gameState} solution={solution} />

          {solving && !showViz && (
            <p className="text-sm text-warm-stone-500 animate-pulse">{t('demo.stage.vizEmpty')}</p>
          )}

          {!solving && !showViz && moves.length === 0 && (
            <p className="text-sm text-warm-stone-500">{t('demo.stage.vizEmpty')}</p>
          )}

          {showViz && VizComponent && gameState && (
            <VizComponent
              trace={trace!}
              solution={solution!}
              gameState={gameState}
              solveStepIndex={solveStepIndex}
              solvePlayback={solvePlayback}
            />
          )}
        </ErrorBoundary>

        {visibleMoves.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-warm-stone-600">
              {t('education.optimalSolution', { count: moves.length })}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {visibleMoves.map((m, i) => {
                const isCurrent = solvePlayback && i === solveStepIndex;
                const label = entry?.formatEducationMove
                  ? entry.formatEducationMove(m, i, { playersFirst, t })
                  : `${i + 1}. ${JSON.stringify(m)}`;
                return (
                  <div
                    key={i}
                    className={`text-xs py-1.5 px-2.5 rounded-md font-mono flex items-center gap-2
                      ${isCurrent
                        ? 'bg-game-amber-100 text-game-amber-700 font-bold'
                        : 'text-warm-stone-600'}`}
                  >
                    <span className="w-5 text-right tabular-nums">{i + 1}.</span>
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
              {moves.length > MAX_STEPS && (
                <p className="text-xs text-warm-stone-400 px-2">… +{moves.length - MAX_STEPS}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
