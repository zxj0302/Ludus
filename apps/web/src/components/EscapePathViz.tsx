import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameState, Solution, SolverTrace } from '@ludus/core';
import type { ThiefSiegeState } from '@ludus/games';

interface Props {
  trace: SolverTrace;
  solution: Solution;
  gameState: GameState;
}

interface Pos {
  row: number;
  col: number;
}

function keyOf(pos: Pos): string {
  return `${pos.row},${pos.col}`;
}

function isSamePos(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

export function EscapePathViz({ trace, solution, gameState }: Props) {
  const { t } = useTranslation();
  const state = gameState as ThiefSiegeState;

  const escapePath = useMemo(() => {
    const data = trace.visualizationData as { escapePath?: Pos[] } | undefined;
    return data?.escapePath ?? [];
  }, [trace.visualizationData]);

  const pathKeys = useMemo(() => new Set(escapePath.map(keyOf)), [escapePath]);
  const copKeys = useMemo(() => new Set(state.cops.map(keyOf)), [state.cops]);
  const pathLength = Math.max(0, escapePath.length - 1);

  return (
    <div className="rounded-card border border-logic-indigo-200 bg-logic-indigo-50 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-logic-indigo-800">
            {t('thiefSiege.viz.title')}
          </h3>
          <p className="mt-1 text-xs text-logic-indigo-700">
            {escapePath.length > 0
              ? t('thiefSiege.viz.pathFound', { count: pathLength })
              : t('thiefSiege.viz.noPath')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-white px-2 py-1 font-semibold text-warm-stone-700">
            {t('thiefSiege.viz.nodes')}: {solution.stats.nodesExplored}
          </span>
          <span className="rounded-lg bg-white px-2 py-1 font-semibold text-warm-stone-700">
            {t('thiefSiege.viz.time', { ms: solution.stats.timeMs })}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1 min-w-max"
          style={{ gridTemplateColumns: `repeat(${state.width}, minmax(0, 2rem))` }}
        >
          {state.cells.map((cell, idx) => {
            const row = Math.floor(idx / state.width);
            const col = idx % state.width;
            const pos = { row, col };
            const isPath = pathKeys.has(keyOf(pos));
            const isCop = copKeys.has(keyOf(pos));
            const isThief = isSamePos(state.thief, pos);
            const isExit = cell === 'exit';
            const isObstacle = cell === 'obstacle';

            const cellClass = isObstacle
              ? 'bg-warm-stone-300 border-warm-stone-400'
              : isCop
                ? 'bg-clarity-teal-600 border-clarity-teal-700 text-white'
                : isThief
                  ? 'bg-logic-indigo-700 border-logic-indigo-800 text-white'
                  : isPath
                    ? 'bg-game-amber-200 border-game-amber-500 ring-2 ring-game-amber-300'
                    : isExit
                      ? 'bg-clarity-teal-light border-clarity-teal-dark'
                      : 'bg-white border-warm-stone-200';

            return (
              <div
                key={idx}
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold ${cellClass}`}
                title={t('thiefSiege.cellLabel', {
                  row: row + 1,
                  col: col + 1,
                  kind: t(`thiefSiege.cell.${cell}`),
                })}
              >
                {isThief ? t('thiefSiege.viz.thiefMark') : isCop ? t('thiefSiege.viz.copMark') : isPath ? '·' : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-warm-stone-600">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-game-amber-500 bg-game-amber-200" />
          {t('thiefSiege.viz.escapePath')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-clarity-teal-dark bg-clarity-teal-light" />
          {t('thiefSiege.viz.exit')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-clarity-teal-700 bg-clarity-teal-600" />
          {t('thiefSiege.viz.cop')}
        </span>
      </div>
    </div>
  );
}
