import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import type { WaterJugState, WaterJugMove } from './types';
import { gcd, isSolvable } from './rules';

export function formatWaterJugMove(
  move: WaterJugMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  if (move.type === 'fill') return ctx.t('education.waterJugFill', { jug: move.jugIndex + 1 });
  if (move.type === 'empty') return ctx.t('education.waterJugEmpty', { jug: move.jugIndex + 1 });
  return ctx.t('education.waterJugPour', { from: move.from + 1, to: move.to + 1 });
}

export function WaterJugStatusCard({ gameState, solution }: StatusCardProps<WaterJugState>) {
  const { t } = useTranslation();
  const caps = gameState.capacities;
  const target = gameState.target;
  const solvable = caps.length >= 2 && isSolvable(caps, target);
  const capGcd = caps.length >= 2 ? gcd(caps[0]!, caps[1]!) : (caps[0] ?? 1);
  const jugLevels = gameState.jugs.join(', ');

  return (
    <GameCard title={t('education.currentState')} icon="💧">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('waterJug.current')} value={jugLevels} colorClass="text-clarity-teal-dark" />
        <StatCell
          label={t('education.optimalSteps')}
          value={solution?.solvable ? solution.stats.solutionLength : '—'}
          colorClass="text-logic-indigo-700"
        />
        <StatCell label={t('education.nodesExplored')} value={solution?.stats.nodesExplored ?? '—'} />
      </div>
      <div className="mt-3 pt-3 border-t border-warm-stone-200 grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('waterJug.target')} value={`${target}L`} colorClass="text-game-amber-700" />
        <StatCell
          label={t('waterJug.gcdInfo', { a: caps[0] ?? '?', b: caps[1] ?? '?', g: capGcd })}
          value={solvable ? '✅' : '❌'}
          colorClass={solvable ? 'text-clarity-teal-dark' : 'text-red-500'}
        />
        <StatCell
          label={t('waterJug.stateSpace')}
          value={caps.reduce((p, c) => p * (c + 1), 1)}
          colorClass="text-warm-stone-600"
        />
      </div>
    </GameCard>
  );
}
