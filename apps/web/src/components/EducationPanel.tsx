import { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Solution } from '@ludus/core';
import { MatrixViz } from './MatrixViz';
import { KnowledgeCard } from './KnowledgeCard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useGameStore } from '../stores/gameStore';
import type { DisclosureLevel } from '../stores/gameStore';
import type { LightsOutState } from '@ludus/games';

import l2zh from '@ludus/education/src/content/lights-out/l2.zh-CN.md?raw';
import l2en from '@ludus/education/src/content/lights-out/l2.en.md?raw';
import l3zh from '@ludus/education/src/content/lights-out/l3.zh-CN.md?raw';
import l3en from '@ludus/education/src/content/lights-out/l3.en.md?raw';

const contentMap: Record<string, Record<string, string>> = {
  'zh-CN': { L2: l2zh, L3: l3zh },
  en: { L2: l2en, L3: l3en },
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
  gameState: LightsOutState | null;
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
  const rawMd = contentMap[language]?.[depth] ?? contentMap['zh-CN']![depth]!;
  const bodyMd = extractBody(rawMd);

  const getSectionId = (english: string) =>
    'section-' + english.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 32);

  const scrollToSection = useCallback((english: string) => {
    const id = getSectionId(english);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // 求解演示时自动滚动到可视化区域（顶部），而非 markdown 章节
  useEffect(() => {
    if (solvePlayback) {
      setHighlightedTab('solve');
      // 滚动到可视化容器顶部
      const vizEl = document.getElementById('solver-viz-top');
      if (vizEl) {
        vizEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  if (!open && !hasBeenOpened) return null;

  const onCount = gameState?.grid.filter(c => c === 1).length ?? 0;
  const totalCells = gameState ? gameState.n * gameState.n : 0;

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
            </div>
          </KnowledgeCard>
        )}

        {/* 矩阵可视化（有解时始终显示） */}
        <div id="solver-viz-top" className="scroll-mt-28" />
        {solution?.trace && (
          <MatrixViz
            solution={solution}
            solveStepIndex={solveStepIndex}
            gameState={gameState}
          />
        )}

        {/* 最优解步骤列表 */}
        {solution?.solvable && solution.moves.length > 0 && (
          <KnowledgeCard title={t('education.optimalSolution', { count: solution.moves.length })} icon="👆">
            <div className="space-y-1 max-h-48 overflow-y-auto" ref={stepsContainerRef}>
              {solution.moves.map((m, i) => {
                const move = m as { row: number; col: number };
                const isCurrentStep = solvePlayback && i === solveStepIndex;
                const isPastStep = solvePlayback && i < solveStepIndex;
                return (
                  <div key={i} ref={isCurrentStep ? currentStepRef : undefined} className={`
                    text-xs py-1.5 px-2.5 rounded-md font-mono flex items-center gap-2 transition-colors
                    ${isCurrentStep ? 'bg-game-amber-100 text-game-amber-700 font-bold' :
                      isPastStep ? 'bg-clarity-teal-light/40 text-clarity-teal-dark' :
                      'text-warm-stone-600'}
                  `}>
                    <span className="w-5 text-right tabular-nums">{i + 1}.</span>
                    <span>{t('education.pressCell', { row: move.row + 1, col: move.col + 1 })}</span>
                    {isCurrentStep && <span className="ml-auto text-[10px]">◀</span>}
                  </div>
                );
              })}
            </div>
          </KnowledgeCard>
        )}

        {/* 完整 Markdown 教学内容（所有章节） */}
        <MarkdownRenderer content={bodyMd} />
      </div>
    </motion.div>
  );
}
