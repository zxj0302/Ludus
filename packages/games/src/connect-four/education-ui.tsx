import { useTranslation } from 'react-i18next';
import type { Solution, SolverTrace } from '@ludus/core';
import type { FormatMoveContext, SolutionPreviewProps, StatusCardProps } from '../types';
import { StatBlock, StatCell, GameCard } from '../ui/GameCard';
import type { ConnectFourMove, ConnectFourState } from './types';
import { countPieces } from './board';

export function formatConnectFourMove(
  move: ConnectFourMove,
  index: number,
  ctx: FormatMoveContext,
): string {
  const isPlayer = ctx.playersFirst ? index % 2 === 0 : index % 2 === 1;
  const who = isPlayer ? '🧑 ' : '🤖 ';
  return who + ctx.t('education.connectFourMove', { column: move.column + 1 });
}

interface StepData {
  column?: number;
  player?: 0 | 1;
  score?: number;
}

export function ConnectFourTraceViz({
  trace,
  solution,
}: {
  trace?: SolverTrace;
  solution: Solution | null;
}) {
  const { t } = useTranslation();
  const steps = trace?.steps ?? [];
  const stats = solution?.stats;
  const viz = trace?.visualizationData as { nodesExplored?: number; maxDepth?: number } | undefined;

  const formatStep = (data: StepData | undefined, fallback: string): string => {
    if (data?.column == null) return fallback;
    const col = data.column + 1;
    if (data.player === 0) return t('connectFour.viz.dropPlayer', { column: col });
    if (data.player === 1) return t('connectFour.viz.dropAi', { column: col });
    return t('connectFour.viz.dropColumn', { column: col });
  };

  return (
    <GameCard title={t('connectFour.viz.title')} icon="🌳">
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <StatCell
            label={t('connectFour.viz.nodes')}
            value={stats.nodesExplored.toLocaleString()}
            colorClass="text-logic-indigo-700"
          />
          <StatCell
            label={t('connectFour.viz.time')}
            value={`${stats.timeMs}ms`}
            colorClass="text-logic-indigo-700"
          />
          <StatCell
            label={t('connectFour.viz.depth')}
            value={viz?.maxDepth ?? '—'}
            colorClass="text-logic-indigo-700"
          />
        </div>
      )}
      <ol className="space-y-1 max-h-48 overflow-y-auto">
        {steps.length === 0 ? (
          <li className="text-xs text-logic-indigo-500">{t('connectFour.viz.empty')}</li>
        ) : (
          steps.slice(0, 24).map((step, i) => (
            <li
              key={i}
              className="text-xs py-1.5 px-2.5 rounded-md font-mono flex items-center gap-2 text-logic-indigo-800 bg-white/70 border border-logic-indigo-100"
            >
              <span className="w-5 text-right tabular-nums text-logic-indigo-400">{i + 1}.</span>
              <span>{formatStep(step.data as StepData | undefined, step.description)}</span>
            </li>
          ))
        )}
      </ol>
    </GameCard>
  );
}

export function ConnectFourSolutionPreview({
  solution,
  solvePlayback,
  solveStepIndex,
  playersFirst,
}: SolutionPreviewProps<ConnectFourState>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {solution.moves.map((move, i) => {
        const isCurrentStep = solvePlayback && i === solveStepIndex;
        const isPastStep = solvePlayback && i < solveStepIndex;
        const label = formatConnectFourMove(move as ConnectFourMove, i, { playersFirst, t });
        return (
          <div
            key={i}
            className={`
              text-xs py-1.5 px-2.5 rounded-md font-mono flex items-center gap-2 transition-colors
              ${isCurrentStep ? 'bg-game-amber-100 text-game-amber-700 font-bold border border-game-amber-200' :
                isPastStep ? 'bg-clarity-teal-light/40 text-clarity-teal-dark border border-clarity-teal-light' :
                'text-logic-indigo-800 bg-white/70 border border-logic-indigo-100'}
            `}
          >
            <span className="w-5 text-right tabular-nums">{i + 1}.</span>
            <span>{label}</span>
            {isCurrentStep && <span className="ml-auto text-[10px]">◀</span>}
          </div>
        );
      })}
    </div>
  );
}

export function ConnectFourChoosingCard() {
  const { t } = useTranslation();
  return (
    <GameCard title={t('connectFour.chooseHand')} icon="🤝">
      <p className="text-xs text-logic-indigo-700 leading-relaxed">{t('connectFour.chooseHandHint')}</p>
    </GameCard>
  );
}

export function ConnectFourStatusCard({ gameState, solution }: StatusCardProps<ConnectFourState>) {
  const { t } = useTranslation();
  const pieces = countPieces(gameState.board);
  const nodesExplored = solution?.stats.nodesExplored;

  let phaseLabel: string;
  if (gameState.phase === 'choosing') {
    phaseLabel = t('connectFour.phaseChoosing');
  } else if (gameState.winner === 0) {
    phaseLabel = t('connectFour.youWin');
  } else if (gameState.winner === 1) {
    phaseLabel = t('connectFour.aiWins');
  } else if (gameState.winner === 'draw') {
    phaseLabel = t('connectFour.draw');
  } else if (gameState.currentPlayer === 0) {
    phaseLabel = t('connectFour.yourTurn');
  } else {
    phaseLabel = t('connectFour.aiThinking');
  }

  return (
    <GameCard title={t('education.currentState')} icon="🔴">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatCell label={t('connectFour.pieces')} value={pieces} colorClass="text-logic-indigo-700" />
        <StatCell label={t('connectFour.phase')} value={phaseLabel} colorClass="text-logic-indigo-700" />
      </div>
      {nodesExplored != null && gameState.phase === 'playing' && (
        <div className="mt-3 pt-3 border-t border-logic-indigo-100">
          <StatCell
            label={t('connectFour.viz.nodes')}
            value={nodesExplored.toLocaleString()}
            colorClass="text-logic-indigo-700"
          />
        </div>
      )}
    </GameCard>
  );
}
