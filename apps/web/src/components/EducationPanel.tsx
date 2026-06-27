import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Solution, GameState, Move } from '@ludus/core';
import { KnowledgeCard } from './KnowledgeCard';
import type { LightsOutMove, SokobanMove, SudokuMove, NimMove, WythoffMove } from '@ludus/games';
import { MarkdownRenderer } from '@ludus/ui';
import { useGameStore } from '../stores/gameStore';
import type { DisclosureLevel } from '@ludus/ui';
import { getEducationContent, extractBody } from '../educationContent';
import { getVizComponent } from '../vizComponents';
import { StatusCard } from '../statusCards';

type Stage = 'play' | 'think' | 'reveal' | 'solve' | 'create';

function formatMove(gameId: string, move: Move, index: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  switch (gameId) {
    case 'lights-out': {
      const m = move as LightsOutMove;
      return t('education.pressCell', { row: m.row + 1, col: m.col + 1 });
    }
    case 'sokoban': {
      const m = move as SokobanMove;
      return t(`education.move.${m.direction}`, m.direction as any);
    }
    case 'sudoku': {
      const m = move as SudokuMove;
      return t('education.sudokuCell', { row: m.row + 1, col: m.col + 1, value: m.value });
    }
    case 'nim': {
      const m = move as NimMove;
      const isPlayer = index % 2 === 0;
      return (isPlayer ? '🧑 ' : '🤖 ') + t('education.nimMove', { pile: m.pileIndex + 1, count: m.removeCount });
    }
    case 'wythoff': {
      const m = move as WythoffMove;
      const isPlayer = index % 2 === 0;
      const icon = isPlayer ? '🧑 ' : '🤖 ';
      if (m.type === 'both') return icon + t('education.wythoffMoveBoth', { count: m.removeCount });
      return icon + t('education.wythoffMoveSingle', { pile: (m.pileIndex ?? 0) + 1, count: m.removeCount });
    }
    default:
      return `${index + 1}. ${JSON.stringify(move)}`;
  }
}

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
  const rawMd = getEducationContent(gameId, language, depth);
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

  // 游戏专属判断（用于解步骤标签）

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
          <StatusCard gameId={gameId} gameState={gameState} solution={solution} solvePlayback={solvePlayback} solveStepIndex={solveStepIndex} />
        )}

        {/* 可视化区域：根据 trace 类型自动选择组件 */}
        <div id="solver-viz-top" className="scroll-mt-28" />

        {solution?.trace && (() => {
          const Viz = getVizComponent(solution.trace as any);
          return Viz ? <Viz solution={solution} solveStepIndex={solveStepIndex} gameState={gameState} trace={solution.trace} /> : null;
        })()}

        {/* 最优解步骤列表 */}
        {solution?.solvable && solution.moves.length > 0 && (
          <KnowledgeCard title={t('education.optimalSolution', { count: solution.moves.length })} icon="👆">
            <div className="space-y-1 max-h-48 overflow-y-auto" ref={stepsContainerRef}>
              {solution.moves.map((m, i) => {
                const isCurrentStep = solvePlayback && i === solveStepIndex;
                const isPastStep = solvePlayback && i < solveStepIndex;
                const label = formatMove(gameId, m, i, t);
                return (
                  <div key={i} ref={isCurrentStep ? currentStepRef : undefined} className={`
                    text-xs py-1.5 px-2.5 rounded-md font-mono flex items-center gap-2 transition-colors
                    ${isCurrentStep ? 'bg-game-amber-100 text-game-amber-700 font-bold' :
                      isPastStep ? 'bg-clarity-teal-light/40 text-clarity-teal-dark' :
                      'text-warm-stone-600'}
                  `}>
                    <span className="w-5 text-right tabular-nums">{i + 1}.</span>
                    <span>{label}</span>
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
