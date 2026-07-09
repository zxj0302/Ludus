// 游戏状态卡片 — 每款游戏的状态信息展示
// EducationPanel 通过此模块渲染，无需 import 游戏专属类型或函数

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameState, Solution } from '@ludus/core';
import { computeNimSum, isWythoffPPosition, isSolvable, gcd } from '@ludus/games';
import type {
  LightsOutState, SokobanState, SudokuState, NimState, WythoffState, WaterJugState, NonogramState,
} from '@ludus/games';
import { KnowledgeCard } from './components/KnowledgeCard';

function StatCell({ label, value, colorClass = 'text-game-amber-700' }: { label: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
      <div className="text-[10px] text-warm-stone-500">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-warm-stone-50 rounded-lg p-2">
      <div className="text-warm-stone-500 text-xs">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

interface Props {
  gameId: string;
  gameState: GameState | null;
  solution: Solution | null;
  solvePlayback: boolean;
  solveStepIndex: number;
}

export function StatusCard({ gameId, gameState, solution }: Props) {
  const { t } = useTranslation();

  // Lifted to top level — hooks must not be called conditionally (Rules of Hooks)
  const sokobanOnGoals = useMemo(() => {
    if (gameId !== 'sokoban') return 0;
    const s = gameState as Record<string, unknown> | null;
    const boxes = (s?.boxes as Array<{row: number; col: number}> | undefined) ?? [];
    const goals = (s?.goals as Array<{row: number; col: number}> | undefined) ?? [];
    return boxes.filter(b => goals.some(g => g.row === b.row && g.col === b.col)).length;
  }, [gameId, gameState]);

  switch (gameId) {
    case 'lights-out': {
      const s = gameState as LightsOutState | null;
      const onCount = s?.grid?.filter(c => c === 1).length ?? 0;
      const totalCells = s ? s.n * s.n : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🎯">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('education.litCells')} value={onCount} />
            <StatCell label={t('education.optimalSteps')} value={solution?.solvable ? solution.stats.solutionLength : '—'} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.litRatio')} value={totalCells > 0 ? `${Math.round((onCount / totalCells) * 100)}%` : '0%'} colorClass="text-logic-indigo-700" />
          </div>
        </KnowledgeCard>
      );
    }
    case 'sokoban': {
      const s = gameState as Record<string, unknown> | null;
      const boxes = (s?.boxes as Array<{row: number; col: number}> | undefined) ?? [];
      return (
        <KnowledgeCard title={t('education.currentState')} icon="📦">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('education.boxesPlaced')} value={`${sokobanOnGoals}/${boxes.length}`} />
            <StatCell label={t('education.optimalSteps')} value={solution?.solvable ? solution.stats.solutionLength : '—'} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.nodesExplored')} value={solution?.stats.nodesExplored ?? 0} colorClass="text-logic-indigo-700" />
          </div>
        </KnowledgeCard>
      );
    }
    case 'sudoku': {
      const s = gameState as SudokuState | null;
      const emptyCount = s?.grid?.filter((v, i) => v === 0 && !s.givenMask[i]).length ?? 0;
      const givenCount = s?.givenMask?.filter(Boolean).length ?? 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🧩">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('education.sudokuEmpty')} value={emptyCount} />
            <StatCell label={t('education.sudokuGivens')} value={givenCount} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.sudokuSolver')} value="DLX" colorClass="text-logic-indigo-700" />
          </div>
        </KnowledgeCard>
      );
    }
    case 'nim': {
      const s = gameState as NimState | null;
      const nimSum = s?.piles ? computeNimSum(s.piles) : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🪨">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <StatBlock label={t('nim.piles')} value={s?.piles?.join(', ') ?? '—'} />
            <StatBlock label={t('nim.nimSum')} value={nimSum} />
          </div>
        </KnowledgeCard>
      );
    }
    case 'wythoff': {
      const s = gameState as WythoffState | null;
      const isP = s?.piles && s.piles.length >= 2 ? isWythoffPPosition(s.piles[0]!, s.piles[1]!) : false;
      const k = s?.piles ? Math.abs(s.piles[1]! - s.piles[0]!) : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="⚖️">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <StatBlock label={t('wythoff.piles')} value={s?.piles ? `${s.piles[0]}, ${s.piles[1]}` : '—'} />
            <StatBlock label={t('wythoff.beattyPair')} value={`k=${k}, ${isP ? 'P' : 'N'}`} />
          </div>
        </KnowledgeCard>
      );
    }
    case 'fifteen': {
      const s = gameState as Record<string, unknown> | null;
      const grid = s?.grid as number[] | undefined;
      // Compute Manhattan distance from current state
      let manhattanDist = 0;
      if (grid) {
        for (let i = 0; i < 16; i++) {
          const val = grid[i]!;
          if (val === 0) continue;
          const targetRow = Math.floor((val - 1) / 4);
          const targetCol = (val - 1) % 4;
          const currentRow = Math.floor(i / 4);
          const currentCol = i % 4;
          manhattanDist += Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
        }
      }
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🧩">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('fifteen.manhattanDist')} value={manhattanDist} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('fifteen.nodesExplored')} value={solution?.stats.nodesExplored ?? '—'} colorClass="text-logic-indigo-700" />
            <StatCell label={t('fifteen.solutionPath')} value={solution?.stats.solutionLength ?? '—'} />
          </div>
        </KnowledgeCard>
      );
    }
    case 'water-jug': {
      const s = gameState as WaterJugState | null;
      const caps = s?.capacities ?? [];
      const target = s?.target ?? 0;
      const solvable = caps.length >= 2 && isSolvable(caps, target);
      const capGcd = caps.length >= 2 ? gcd(caps[0]!, caps[1]!) : (caps[0] ?? 1);
      const jugLevels = s?.jugs?.join(', ') ?? '—';
      return (
        <KnowledgeCard title={t('education.currentState')} icon="💧">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('waterJug.current')} value={jugLevels} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.optimalSteps')} value={solution?.solvable ? solution.stats.solutionLength : '—'} colorClass="text-logic-indigo-700" />
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
        </KnowledgeCard>
      );
    }
    case 'nonogram': {
      const s = gameState as NonogramState | null;
      const filledCount = s?.grid?.flat().filter(c => c === 1).length ?? 0;
      const totalCells = (s?.width ?? 0) * (s?.height ?? 0);
      const nodesExplored = solution?.stats.nodesExplored ?? '—';
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🧩">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('nonogram.cells')} value={`${filledCount}/${totalCells}`} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('nonogram.lineSolved')} value={s?.lineSolveCells ?? '—'} colorClass="text-logic-indigo-700" />
            <StatCell label={t('nonogram.backtrackDepth')} value={s?.maxBacktrackDepth ?? '—'} />
          </div>
          <div className="mt-3 pt-3 border-t border-warm-stone-200 grid grid-cols-2 gap-2 text-sm">
            {/* Nonogram generator guarantees unique solutions via countSolutions(2) === 1 */}
            <StatCell label={t('nonogram.uniqueSolution')} value="✅" colorClass="text-clarity-teal-dark" />
            <StatCell label={t('nonogram.nodesExplored')} value={nodesExplored} colorClass="text-logic-indigo-700" />
          </div>
        </KnowledgeCard>
      );
    }
    default:
      return null;
  }
}
