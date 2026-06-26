import { useRef, useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Solution, GameState } from '@ludus/core';
import { computeNimSum } from '@ludus/core';
import { MatrixViz } from './MatrixViz';
import { KnowledgeCard } from './KnowledgeCard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useGameStore } from '../stores/gameStore';
import type { DisclosureLevel } from '../stores/gameStore';
import type { LightsOutState, SokobanState, SudokuState, NimState } from '@ludus/games';

const BFSTreeViz = lazy(() => import('./BFSTreeViz'));
const DLXMatrixViz = lazy(() => import('./DLXMatrixViz').then(m => ({ default: m.DLXMatrixViz })));
const NimTreeViz = lazy(() => import('./NimTreeViz').then(m => ({ default: m.NimTreeViz })));

import l2zhLO from '@ludus/education/src/content/lights-out/l2.zh-CN.md?raw';
import l2enLO from '@ludus/education/src/content/lights-out/l2.en.md?raw';
import l3zhLO from '@ludus/education/src/content/lights-out/l3.zh-CN.md?raw';
import l3enLO from '@ludus/education/src/content/lights-out/l3.en.md?raw';
import l2zhSK from '@ludus/education/src/content/sokoban/l2.zh-CN.md?raw';
import l2enSK from '@ludus/education/src/content/sokoban/l2.en.md?raw';
import l3zhSK from '@ludus/education/src/content/sokoban/l3.zh-CN.md?raw';
import l3enSK from '@ludus/education/src/content/sokoban/l3.en.md?raw';

import l2zhSU from '@ludus/education/src/content/sudoku/l2.zh-CN.md?raw';
import l2enSU from '@ludus/education/src/content/sudoku/l2.en.md?raw';
import l3zhSU from '@ludus/education/src/content/sudoku/l3.zh-CN.md?raw';
import l3enSU from '@ludus/education/src/content/sudoku/l3.en.md?raw';

import l2zhNI from '@ludus/education/src/content/nim/l2.zh-CN.md?raw';
import l2enNI from '@ludus/education/src/content/nim/l2.en.md?raw';
import l3zhNI from '@ludus/education/src/content/nim/l3.zh-CN.md?raw';
import l3enNI from '@ludus/education/src/content/nim/l3.en.md?raw';

const CONTENT_MAPS: Record<string, Record<string, Record<string, string>>> = {
  'lights-out': {
    'zh-CN': { L2: l2zhLO, L3: l3zhLO },
    en: { L2: l2enLO, L3: l3enLO },
  },
  sokoban: {
    'zh-CN': { L2: l2zhSK, L3: l3zhSK },
    en: { L2: l2enSK, L3: l3enSK },
  },
  sudoku: {
    'zh-CN': { L2: l2zhSU, L3: l3zhSU },
    en: { L2: l2enSU, L3: l3enSU },
  },
  nim: {
    'zh-CN': { L2: l2zhNI, L3: l3zhNI },
    en: { L2: l2enNI, L3: l3enNI },
  },
};

/** 从 markdown 提取正文（跳过 frontmatter） */
function extractBody(md: string): string {
  const parts = md.split(/^---$/m);
  if (parts.length >= 3) return parts.slice(2).join('---').trim();
  return md;
}

type Stage = 'play' | 'think' | 'reveal' | 'solve' | 'create';

const STAGES: { key: Stage; i18nKey: string; english: string }[] = [
  { key: 'play', i18nKey: 'education.section.play', english: 'Play' },
  { key: 'think', i18nKey: 'education.section.think', english: 'Think' },
  { key: 'reveal', i18nKey: 'education.section.reveal', english: 'Reveal' },
  { key: 'solve', i18nKey: 'education.section.solve', english: 'Solve' },
  { key: 'create', i18nKey: 'education.section.create', english: 'Create' },
];

interface Props {
  gameId: string;
  open: boolean;
  onClose: () => void;
  disclosureLevel: DisclosureLevel;
  onChangeDisclosureLevel: (level: DisclosureLevel) => void;
  solution: Solution | null;
  solvePlayback: boolean;
  solveStepIndex: number;
  gameState: GameState | null;
}

export function EducationPanel({
  gameId, open, onClose, disclosureLevel, onChangeDisclosureLevel,
  solution, solvePlayback, solveStepIndex, gameState,
}: Props) {
  const { t } = useTranslation();
  const language = useGameStore(s => s.language);
  const contentRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const currentStepRef = useRef<HTMLDivElement>(null);
  const [highlightedTab, setHighlightedTab] = useState<Stage>('think');
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  // 首次打开后保持挂载，避免后续开/关时 mount/unmount 导致动画卡顿
  useEffect(() => {
    if (open) setHasBeenOpened(true);
  }, [open]);

  // 播放时自动滚动步骤列表，保持当前步骤可见
  useEffect(() => {
    if (solvePlayback && currentStepRef.current) {
      currentStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [solveStepIndex, solvePlayback]);

  const depth = disclosureLevel >= 3 ? 'L3' : 'L2';
  const gameContent = CONTENT_MAPS[gameId] ?? CONTENT_MAPS['lights-out']!;
  const rawMd = gameContent[language]?.[depth] ?? gameContent['zh-CN']?.[depth] ?? '';
  const bodyMd = useMemo(() => extractBody(rawMd), [rawMd]);

  const getSectionId = (english: string) =>
    'section-' + english.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 32);

  const scrollToSection = useCallback((english: string) => {
    const id = getSectionId(english);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // 求解演示时自动滚动到可视化区域
  useEffect(() => {
    if (solvePlayback) {
      setHighlightedTab('solve');
      // 找到实际滚动容器（EducationPanel 外层 motion.div 有 overflow-y-auto）
      const vizEl = document.getElementById('solver-viz-top');
      const scrollParent = vizEl?.closest('.overflow-y-auto') as HTMLElement | null;
      if (scrollParent && vizEl) {
        scrollParent.scrollTo({ top: vizEl.offsetTop - scrollParent.offsetTop - 20, behavior: 'smooth' });
      } else {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [solvePlayback]);

  const handleTabClick = useCallback((stage: Stage) => {
    setHighlightedTab(stage);
    const info = STAGES.find(s => s.key === stage);
    if (info) scrollToSection(info.english);
  }, [scrollToSection]);

  // Stats — must be computed before any conditional return (hooks rule)
  const loState = gameState as LightsOutState | null;
  const suState = gameState as SudokuState | null;
  const niState = gameState as NimState | null;
  const onCount = loState?.grid?.filter(c => c === 1).length ?? 0;
  const totalCells = loState ? loState.n * loState.n : 0;

  const soState = gameState as Record<string, unknown> | null;
  const boxesOnGoals = useMemo(() =>
    (soState?.boxes as Array<{ row: number; col: number }> | undefined)?.filter(
      b => (soState?.goals as Array<{ row: number; col: number }> | undefined)?.some(g => g.row === b.row && g.col === b.col)
    ).length ?? 0,
    [soState?.boxes, soState?.goals],
  );
  const totalBoxes = (soState?.boxes as Array<unknown> | undefined)?.length ?? 0;

  const isLO = gameId === 'lights-out';
  const isSK = gameId === 'sokoban';
  const isSU = gameId === 'sudoku';
  const isNI = gameId === 'nim';

  if (!open && !hasBeenOpened) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-card shadow-card border border-warm-stone-200/60 overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-warm-stone-200 px-5 py-3 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-warm-stone-800">{t('education.title')}</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-warm-stone-100 p-0.5">
              {([2, 3] as DisclosureLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChangeDisclosureLevel(level)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all
                    ${disclosureLevel === level
                      ? 'bg-white text-logic-indigo-700 shadow-sm'
                      : 'text-warm-stone-500 hover:text-warm-stone-700'}`}
                >
                  {t(`disclosure.l${level}`)}
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose}
              className="w-7 h-7 rounded-btn flex items-center justify-center hover:bg-warm-stone-100 text-warm-stone-500 transition-colors text-sm">
              ✕
            </button>
          </div>
        </div>

        {/* 五段式快速跳转 Tab */}
        <div className="flex gap-1 overflow-x-auto">
          {STAGES.map(({ key, i18nKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabClick(key)}
              className={`shrink-0 px-3 py-1.5 rounded-btn text-xs font-medium transition-all
                ${highlightedTab === key
                  ? 'bg-logic-indigo-600 text-white shadow-sm'
                  : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'}`}
            >
              {t(i18nKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Full content — all sections visible, scroll to navigate */}
      <div className="px-5 py-4 space-y-4" ref={contentRef}>
        {/* 实时状态卡片 */}
        {gameState && (
          <KnowledgeCard title={t('education.currentState')} icon="🎯">
            <div className="grid grid-cols-3 gap-2 text-sm">
              {isLO && (
                <>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.litCells')}</div>
                    <div className="text-lg font-bold text-game-amber-700">{onCount}</div>
                  </div>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.optimalSteps')}</div>
                    <div className="text-lg font-bold text-clarity-teal-dark">
                      {solution?.solvable ? solution.stats.solutionLength : '—'}
                    </div>
                  </div>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.litRatio')}</div>
                    <div className="text-lg font-bold text-logic-indigo-700">
                      {totalCells > 0 ? Math.round((onCount / totalCells) * 100) : 0}%
                    </div>
                  </div>
                </>
              )}
              {isSK && (
                <>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.boxesPlaced')}</div>
                    <div className="text-lg font-bold text-game-amber-700">{boxesOnGoals}/{totalBoxes}</div>
                  </div>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.optimalSteps')}</div>
                    <div className="text-lg font-bold text-clarity-teal-dark">
                      {solution?.solvable ? solution.stats.solutionLength : '—'}
                    </div>
                  </div>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.nodesExplored')}</div>
                    <div className="text-lg font-bold text-logic-indigo-700">
                      {solution?.stats.nodesExplored ?? 0}
                    </div>
                  </div>
                </>
              )}
              {isSU && (
                <>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.sudokuEmpty')}</div>
                    <div className="text-lg font-bold text-game-amber-700">
                      {suState?.grid?.filter(v => v === 0).length ?? 0}
                    </div>
                  </div>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.sudokuGivens')}</div>
                    <div className="text-lg font-bold text-clarity-teal-dark">
                      {suState?.givenMask?.filter(Boolean).length ?? 0}
                    </div>
                  </div>
                  <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                    <div className="text-[10px] text-warm-stone-500">{t('education.sudokuSolver')}</div>
                    <div className="text-lg font-bold text-logic-indigo-700">DLX</div>
                  </div>
                </>
              )}
            </div>
            {isNI && niState?.piles && (
              <div className="space-y-2 mt-2">
                <h4 className="text-xs font-semibold text-warm-stone-600 uppercase tracking-wide">{t('game.nim.name')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-warm-stone-50 rounded-lg p-2">
                    <div className="text-warm-stone-500 text-xs">{t('nim.piles')}</div>
                    <div className="font-mono font-semibold">{niState.piles.join(', ')}</div>
                  </div>
                  <div className="bg-warm-stone-50 rounded-lg p-2">
                    <div className="text-warm-stone-500 text-xs">{t('nim.nimSum')}</div>
                    <div className="font-mono font-semibold">{computeNimSum(niState.piles)}</div>
                  </div>
                </div>
              </div>
            )}
          </KnowledgeCard>
        )}

        {/* 可视化区域：根据游戏类型 / trace 类型选择组件 */}
        <div id="solver-viz-top" className="scroll-mt-28" />

        {/* Sokoban：交互式逐层展开树 */}
        {isSK && gameState && (gameState as SokobanState).boxes && (
          <Suspense fallback={<div className="h-80 rounded-card bg-warm-stone-100 animate-pulse" />}>
            <BFSTreeViz gameState={gameState as SokobanState} />
          </Suspense>
        )}

        {/* Lights Out：矩阵消元可视化 */}
        {solution?.trace?.type === 'matrix-transform' && (
          <MatrixViz
            solution={solution}
            solveStepIndex={solveStepIndex}
            gameState={loState}
          />
        )}

        {/* Sudoku：DLX 约束传播可视化 */}
        {solution?.trace?.type === 'constraint-propagation' && (
          <Suspense fallback={<div className="h-40 rounded-card bg-warm-stone-100 animate-pulse" />}>
            <DLXMatrixViz solution={solution} activeStep={solveStepIndex} />
          </Suspense>
        )}

        {/* Nim：XOR 游戏树可视化 */}
        {solution?.trace?.type === 'nim-xor' && niState && (
          <Suspense fallback={<div className="h-48 bg-warm-stone-100 rounded-lg animate-pulse" />}>
            <NimTreeViz trace={solution.trace} state={niState} />
          </Suspense>
        )}

        {/* 最优解步骤列表 */}
        {solution?.solvable && solution.moves.length > 0 && (
          <KnowledgeCard title={t('education.optimalSolution', { count: solution.moves.length })} icon="👆">
            <div className="space-y-1 max-h-48 overflow-y-auto" ref={stepsContainerRef}>
              {solution.moves.map((m, i) => {
                const isCurrentStep = solvePlayback && i === solveStepIndex;
                const isPastStep = solvePlayback && i < solveStepIndex;

                // Render move description based on game type
                let moveLabel: string;
                if (isLO) {
                  const move = m as { row: number; col: number };
                  moveLabel = t('education.pressCell', { row: move.row + 1, col: move.col + 1 });
                } else if (isSU) {
                  const move = m as { row: number; col: number; value: number };
                  moveLabel = t('education.sudokuCell', { row: move.row + 1, col: move.col + 1, value: move.value });
                } else if (isNI) {
                  const move = m as { pileIndex: number; removeCount: number };
                  moveLabel = t('education.nimMove', { pile: move.pileIndex + 1, count: move.removeCount });
                } else {
                  const move = m as { direction: string };
                  moveLabel = t(`education.move.${move.direction}`, move.direction);
                }

                return (
                  <div key={i} ref={isCurrentStep ? currentStepRef : undefined} className={`
                    text-xs py-1.5 px-2.5 rounded-md font-mono flex items-center gap-2 transition-colors
                    ${isCurrentStep ? 'bg-game-amber-100 text-game-amber-700 font-bold' :
                      isPastStep ? 'bg-clarity-teal-light/40 text-clarity-teal-dark' :
                      'text-warm-stone-600'}
                  `}>
                    <span className="w-5 text-right tabular-nums">{i + 1}.</span>
                    <span>{moveLabel}</span>
                    {isCurrentStep && <span className="ml-auto text-[10px]">◀</span>}
                  </div>
                );
              })}
            </div>
          </KnowledgeCard>
        )}

        {/* 完整 Markdown 教学内容（所有章节） */}
        {bodyMd && <MarkdownRenderer content={bodyMd} />}
      </div>
    </motion.div>
  );
}
