import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Solution, SolverTrace } from '@ludus/core';
import type { PegSolitaireMove } from '@ludus/games';

interface Props {
  trace: SolverTrace;
  solution: Solution;
}

interface PegTraceData {
  nodesExplored?: number;
  timeMs?: number;
  solutionLength?: number;
  path?: PegSolitaireMove[];
  maxDepth?: number;
  terminated?: 'solved' | 'timeout' | 'exhausted';
  symmetry?: string;
  search?: 'bfs' | 'dfs' | string;
}

function holeLabel(hole: number): string {
  return `#${hole + 1}`;
}

function asPegMoves(value: unknown): PegSolitaireMove[] {
  if (!Array.isArray(value)) return [];
  return value.filter((move): move is PegSolitaireMove => (
    typeof move === 'object' &&
    move !== null &&
    Number.isInteger((move as Partial<PegSolitaireMove>).from) &&
    Number.isInteger((move as Partial<PegSolitaireMove>).over) &&
    Number.isInteger((move as Partial<PegSolitaireMove>).to)
  ));
}

export function PegSearchViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const data = (trace.visualizationData ?? {}) as PegTraceData;
  const path = useMemo(() => {
    const tracePath = asPegMoves(data.path);
    if (tracePath.length > 0) return tracePath;
    return asPegMoves(solution.moves);
  }, [data.path, solution.moves]);

  const nodesExplored = data.nodesExplored ?? solution.stats.nodesExplored ?? 0;
  const solutionLength = data.solutionLength ?? solution.stats.solutionLength ?? path.length;
  const timeMs = data.timeMs ?? solution.stats.timeMs ?? 0;
  const maxDepth = data.maxDepth ?? trace.steps.length;
  const terminated = data.terminated ?? solution.stats.terminated ?? (solution.solvable ? 'solved' : 'exhausted');
  const search = data.search ?? 'dfs';
  const symmetry = data.symmetry ?? 'D4';

  return (
    <div className="rounded-card border border-logic-indigo-200 bg-logic-indigo-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-logic-indigo-200 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-logic-indigo-900">{t('pegSolitaire.viz.title')}</h3>
          <p className="text-xs text-logic-indigo-600 mt-1">{t('pegSolitaire.viz.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-logic-indigo-700 border border-logic-indigo-200 hover:bg-logic-indigo-100 transition-colors"
        >
          {expanded ? t('pegSolitaire.viz.collapse') : t('pegSolitaire.viz.expand')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 text-sm">
        <Stat label={t('pegSolitaire.viz.nodesExplored')} value={nodesExplored.toLocaleString()} tone="indigo" />
        <Stat label={t('pegSolitaire.viz.solutionLength')} value={solutionLength} tone="teal" />
        <Stat label={t('pegSolitaire.viz.timeMs')} value={t('pegSolitaire.viz.ms', { ms: timeMs })} tone="stone" />
        <Stat label={t('pegSolitaire.viz.maxDepth')} value={maxDepth} tone="amber" />
        <Stat label={t('pegSolitaire.viz.terminated')} value={t(`pegSolitaire.viz.terminated.${terminated}`)} tone={terminated === 'solved' ? 'teal' : 'amber'} />
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-2 text-xs">
        <Badge>{t('pegSolitaire.viz.searchMode', { mode: t(`pegSolitaire.viz.search.${search}`) })}</Badge>
        <Badge>{t('pegSolitaire.viz.symmetry', { symmetry })}</Badge>
        <Badge>{solution.solvable ? t('pegSolitaire.viz.reachable') : t('pegSolitaire.viz.notReached')}</Badge>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-4 rounded-card bg-white border border-warm-stone-200 p-3">
              <h4 className="text-sm font-bold text-warm-stone-800 mb-2">{t('pegSolitaire.viz.pathTitle')}</h4>
              {path.length > 0 ? (
                <ol className="space-y-2">
                  {path.slice(0, 12).map((move, index) => (
                    <li key={`${move.from}-${move.over}-${move.to}-${index}`} className="flex items-center gap-2 text-sm">
                      <span className="w-7 h-7 rounded-full bg-game-amber-100 text-game-amber-800 font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-warm-stone-700">
                        {t('pegSolitaire.viz.jumpLabel', {
                          from: holeLabel(move.from),
                          over: holeLabel(move.over),
                          to: holeLabel(move.to),
                        })}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-warm-stone-500">{t('pegSolitaire.viz.emptyPath')}</p>
              )}
              {path.length > 12 && (
                <p className="mt-3 text-xs text-warm-stone-500">
                  {t('pegSolitaire.viz.moreMoves', { count: path.length - 12 })}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-1 rounded-full bg-white border border-logic-indigo-100 text-logic-indigo-700 font-semibold">
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'indigo' | 'teal' | 'stone' | 'amber';
}) {
  const toneClass = {
    indigo: 'bg-logic-indigo-100 text-logic-indigo-800',
    teal: 'bg-clarity-teal-100 text-clarity-teal-800',
    stone: 'bg-warm-stone-100 text-warm-stone-700',
    amber: 'bg-game-amber-100 text-game-amber-800',
  }[tone];

  return (
    <div className={`rounded-card px-3 py-2 ${toneClass}`}>
      <div className="text-xs font-semibold opacity-75">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
