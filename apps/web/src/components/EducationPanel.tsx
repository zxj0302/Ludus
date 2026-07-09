import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Solution, GameState, SolverTrace } from '@ludus/core';
import { KnowledgeCard } from './KnowledgeCard';
import { getGameEntry } from '@ludus/games';
import { MarkdownRenderer } from '@ludus/ui';
import { useGameStore } from '../stores/gameStore';
import type { DisclosureLevel } from '@ludus/ui';
import { StatusCard } from '../statusCards';
import { getPlayerStarts } from '../utils/solution';

type Stage = 'play' | 'think' | 'reveal' | 'solve' | 'create';

const ChevronUpIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const STAGES: { key: Stage; i18nKey: string; english: string }[] = [
  { key: 'play', i18nKey: 'education.section.play', english: 'Play' },
  { key: 'think', i18nKey: 'education.section.think', english: 'Think' },
  { key: 'reveal', i18nKey: 'education.section.reveal', english: 'Reveal' },
  { key: 'solve', i18nKey: 'education.section.solve', english: 'Solve' },
  { key: 'create', i18nKey: 'education.section.create', english: 'Create' },
];

const sectionIdOf = (english: string) =>
  'section-' + english.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 32);

interface SectionStyle {
  icon: string;
  borderColor: string;
  bgColor: string;
  headerColor: string;
}

const SECTION_STYLES = {
  play:   { icon: '\u{1F3AE}', borderColor: 'var(--clarity-teal-dark)',    bgColor: '#ccfbef', headerColor: 'var(--clarity-teal-dark)' },
  think:  { icon: '\u{1F4A1}', borderColor: 'var(--game-amber-400)',       bgColor: 'var(--game-amber-100)',  headerColor: 'var(--game-amber-700)' },
  reveal: { icon: '\u{1F52C}', borderColor: 'var(--logic-indigo-600)',     bgColor: 'var(--logic-indigo-50)', headerColor: 'var(--logic-indigo-700)' },
  solve:  { icon: '⚙️',       borderColor: 'var(--sky-blue-600)',         bgColor: 'var(--sky-blue-50)',     headerColor: 'var(--sky-blue-700)' },
  create: { icon: '\u{1F3A8}', borderColor: 'var(--violet-600)',           bgColor: 'var(--violet-50)',       headerColor: 'var(--violet-700)' },
};


const knownStages = new Set(STAGES.map(s => s.key));

function splitSections(md: string): { key: string; english: string; chinese: string; body: string }[] {
  const sections: { key: string; english: string; chinese: string; body: string }[] = [];
  const parts = md.split(/^## /m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf('\n');
    const heading = newlineIdx >= 0 ? part.slice(0, newlineIdx).trim() : part.trim();
    const body = newlineIdx >= 0 ? part.slice(newlineIdx + 1).trim() : '';

    const englishPart = heading.includes('·')
      ? heading.split('·').pop()!.trim()
      : heading.replace(/^\d+\.\s*/, '').trim();
    const englishLower = englishPart.toLowerCase();
    const chinesePart = heading.includes('·')
      ? heading.split('·')[0]!.replace(/^\d+\.\s*/, '').trim()
      : englishPart;

    if ((knownStages as Set<string>).has(englishLower) && body) {
      sections.push({ key: englishLower, english: englishPart, chinese: chinesePart, body });
    }
  }
  return sections;
}

const SectionCard = React.memo(function SectionCard({
  section, language,
}: {
  section: { key: string; english: string; chinese: string; body: string };
  language: string;
}) {
  const style = SECTION_STYLES[section.key as keyof typeof SECTION_STYLES];
  if (!style) return <MarkdownRenderer content={section.body} />;

  const title = language.startsWith('zh') ? section.chinese : section.english;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bento-card overflow-hidden"
      id={sectionIdOf(section.english)}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-warm-stone-100"
        style={{ borderLeft: `4px solid ${style.borderColor}`, backgroundColor: style.bgColor }}
      >
        <span className="text-base">{style.icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: style.headerColor }}>
          {title}
        </h3>
      </div>
      <div className="px-4 py-3">
        <MarkdownRenderer content={section.body} />
      </div>
    </motion.div>
  );
});

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

  useEffect(() => {
    if (open) setHasBeenOpened(true);
  }, [open]);

  useEffect(() => {
    if (solvePlayback && currentStepRef.current) {
      currentStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [solveStepIndex, solvePlayback]);

  const depth = disclosureLevel >= 3 ? 'L3' : 'L2';
  const entry = useMemo(() => getGameEntry(gameId), [gameId]);
  const rawMd = useMemo(() => {
    const md = entry?.education.content[`${depth}.${language}`] ?? '';
    const parts = md.split(/^---$/m);
    return parts.length >= 3 ? parts.slice(2).join('---').trim() : md;
  }, [entry, language, depth]);

  const sections = useMemo(() => splitSections(rawMd), [rawMd]);

  const scrollToSection = useCallback((english: string) => {
    const el = document.getElementById(sectionIdOf(english));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (solvePlayback) {
      setHighlightedTab('solve');
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

  const scrollToTop = useCallback(() => {
    const vizEl = document.getElementById('solver-viz-top');
    const scrollParent = vizEl?.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollParent) {
      scrollParent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  if (!open && !hasBeenOpened) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-card shadow-card border border-warm-stone-200/60"
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
            <button type="button" onClick={scrollToTop}
              className="w-7 h-7 rounded-btn flex items-center justify-center hover:bg-warm-stone-100 text-warm-stone-500 transition-colors"
              title={t('education.backToTop')}
            >
              {ChevronUpIcon}
            </button>
            <button type="button" onClick={onClose}
              className="w-7 h-7 rounded-btn flex items-center justify-center hover:bg-warm-stone-100 text-warm-stone-500 transition-colors text-sm">
              ✕
            </button>
          </div>
        </div>

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

      <div className="px-5 py-4 space-y-4" ref={contentRef}>
        {(gameState || solution?.trace || solution?.solvable) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bento-card overflow-hidden"
            id="solver-viz-top"
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b border-warm-stone-100"
              style={{ borderLeft: '4px solid var(--sky-blue-600)', backgroundColor: 'var(--sky-blue-50)' }}
            >
              <span className="text-base">📊</span>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--sky-blue-700)' }}>
                {t('education.liveAnalysis')}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {gameState && (
                <StatusCard gameId={gameId} gameState={gameState} solution={solution} />
              )}

              {solution?.trace && (() => {
                const VizComponent = entry?.visualization?.Component;
                const matchTrace = entry?.visualization?.matchTrace;
                if (!VizComponent || !matchTrace || !matchTrace(solution.trace as SolverTrace)) return null;
                return (
                  <VizComponent trace={solution.trace as SolverTrace} solution={solution} gameState={gameState!} solveStepIndex={solveStepIndex} solvePlayback={solvePlayback} />
                );
              })()}

              {solution?.solvable && (() => {
                const isGameOver = gameState && entry?.plugin.isSolved(gameState);
                const hasMoves = solution.moves.length > 0;

                let title: string; let icon: string; let body: React.ReactNode;

                if (hasMoves) {
                  // Nonogram: show solution as a visual grid instead of a step list
                  if (gameId === 'nonogram') {
                    const vizData = solution.trace?.visualizationData as { solutionGrid?: boolean[][] | null } | undefined;
                    const solGrid = vizData?.solutionGrid ?? null;
                    const w = solGrid?.[0]?.length ?? 0;
                    const h = solGrid?.length ?? 0;
                    title = t('education.optimalSolution', { count: solution.moves.length });
                    icon = '👆';
                    body = solGrid && w > 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[10px] text-warm-stone-500">{t('nonogram.solutionPreview')}</div>
                        <div
                          className="grid border-2 border-warm-stone-500"
                          style={{
                            gridTemplateColumns: `repeat(${w}, 1fr)`,
                            width: Math.min(200, w * 20),
                          }}
                        >
                          {solGrid.flat().map((filled, i) => (
                            <div
                              key={i}
                              className="border-[0.5px] border-warm-stone-300"
                              style={{
                                aspectRatio: '1',
                                background: filled ? '#292524' : '#fafaf9',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-warm-stone-500">{t('nonogram.noTrace')}</p>
                    );
                  } else {
                    title = t('education.optimalSolution', { count: solution.moves.length });
                    icon = '👆';
                    const playersFirst = getPlayerStarts(solution);
                    body = (
                      <div className="space-y-1 max-h-48 overflow-y-auto" ref={stepsContainerRef}>
                        {solution.moves.map((m, i) => {
                          const isCurrentStep = solvePlayback && i === solveStepIndex;
                          const isPastStep = solvePlayback && i < solveStepIndex;
                          const label = entry?.formatEducationMove
                            ? entry.formatEducationMove(m, i, { playersFirst, t })
                            : `${i + 1}. ${JSON.stringify(m)}`;
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
                    );
                  }
                } else if (isGameOver) {
                  title = t('education.gameOver');
                  icon = '🏁';
                  body = <p className="text-xs text-warm-stone-600">{t('education.gameOverHint')}</p>;
                } else {
                  title = t('education.noWinningMove');
                  icon = '⚠️';
                  body = <p className="text-xs text-warm-stone-600">{t('game.status.noWinningMove')}</p>;
                }

                return (
                  <KnowledgeCard title={title} icon={icon}>
                    {body}
                  </KnowledgeCard>
                );
              })()}
            </div>
          </motion.div>
        )}

        {sections.length > 0 ? (
          <div className="space-y-3">
            {sections.map(section => (
              <SectionCard key={section.key} section={section} language={language} />
            ))}
          </div>
        ) : rawMd ? (
          <MarkdownRenderer content={rawMd} />
        ) : null}

        <div className="sticky bottom-3 flex justify-end pointer-events-none">
          <button
            type="button"
            onClick={scrollToTop}
            className="pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center
              bg-white/90 backdrop-blur-sm border border-warm-stone-200 shadow-md
              text-warm-stone-400 hover:text-warm-stone-600 hover:border-warm-stone-300
              transition-all"
            title={t('education.backToTop')}
          >
            {ChevronUpIcon}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
