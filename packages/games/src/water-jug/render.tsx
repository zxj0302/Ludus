import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { WaterJugState, WaterJugMove } from './types';

const JUG_WIDTH = 96;
const JUG_HEIGHT = 220;
const WATER_COLOR = '#3b82f6';
const WATER_ANIM_DURATION = 0.4;

export function WaterJugBoard({ state, onMove, disabled, highlightCell }: BoardProps<WaterJugState, WaterJugMove>) {
  const { t } = useTranslation();
  const [selectedJug, setSelectedJug] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHighlighted = useCallback((jugIndex: number) => {
    if (!highlightCell) return false;
    return highlightCell.row === jugIndex;
  }, [highlightCell]);

  // --- Jug click: fill (if no selection), pour target (if selection active), or select ---
  const handleJugClick = useCallback((jugIndex: number) => {
    if (disabled) return;

    if (selectedJug !== null && selectedJug !== jugIndex) {
      // Second jug clicked → pour from selected to this one if legal
      if (state.jugs[selectedJug]! > 0 && state.jugs[jugIndex]! < state.capacities[jugIndex]!) {
        onMove({ type: 'pour', from: selectedJug, to: jugIndex });
      }
      setSelectedJug(null);
      return;
    }

    if (selectedJug === jugIndex) {
      // Same jug clicked → deselect (cancel pour)
      setSelectedJug(null);
      return;
    }

    // No selection → fill if empty, otherwise select this jug for potential pour
    if (state.jugs[jugIndex] === 0) {
      onMove({ type: 'fill', jugIndex });
      return;
    }
    setSelectedJug(jugIndex);
  }, [disabled, selectedJug, state.jugs, state.capacities, onMove]);

  // --- Double-click: empty the jug ---
  const handleJugDoubleClick = useCallback((jugIndex: number) => {
    if (disabled) return;
    if (state.jugs[jugIndex] === 0) return;
    setSelectedJug(null);
    onMove({ type: 'empty', jugIndex });
  }, [disabled, state.jugs, onMove]);

  // --- Fill button ---
  const handleFill = useCallback((jugIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (state.jugs[jugIndex] === state.capacities[jugIndex]) return;
    setSelectedJug(null);
    onMove({ type: 'fill', jugIndex });
  }, [disabled, state.jugs, state.capacities, onMove]);

  // --- Empty button ---
  const handleEmpty = useCallback((jugIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (state.jugs[jugIndex] === 0) return;
    setSelectedJug(null);
    onMove({ type: 'empty', jugIndex });
  }, [disabled, state.jugs, onMove]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      const n = state.jugs.length;

      // Number keys: select jug N or pour if already selected
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (idx >= n) return;
        if (selectedJug !== null && selectedJug !== idx) {
          if (state.jugs[selectedJug]! > 0 && state.jugs[idx]! < state.capacities[idx]!) {
            onMove({ type: 'pour', from: selectedJug, to: idx });
          }
          setSelectedJug(null);
        } else if (selectedJug === idx) {
          setSelectedJug(null);
        } else {
          setSelectedJug(idx);
        }
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        if (selectedJug !== null) {
          if (state.jugs[selectedJug]! < state.capacities[selectedJug]!) {
            onMove({ type: 'fill', jugIndex: selectedJug });
          }
          setSelectedJug(null);
        }
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        if (selectedJug !== null) {
          if (state.jugs[selectedJug]! > 0) {
            onMove({ type: 'empty', jugIndex: selectedJug });
          }
          setSelectedJug(null);
        }
        return;
      }

      if (e.key === 'Escape') {
        setSelectedJug(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, state, selectedJug, onMove]);

  // --- Click outside to deselect ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedJug(null);
      }
    };
    if (selectedJug !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedJug]);

  const solved = state.jugs.some(amt => amt === state.target);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 select-none">
      {/* Target display */}
      <div className={`text-lg font-bold px-4 py-2 rounded-btn ${
        solved
          ? 'bg-game-amber-200 text-game-amber-800 ring-2 ring-game-amber-400'
          : 'bg-warm-stone-100 text-warm-stone-700'
      }`}>
        {solved ? t('waterJug.solved') : t('waterJug.target', { t: state.target })}
      </div>

      {/* Hint text */}
      <div className="text-xs text-warm-stone-400 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <span>💡 {t('waterJug.clickToPour')}</span>
        <span>{t('waterJug.clickToFill')}</span>
        <span>{t('waterJug.clickToEmpty')}</span>
      </div>

      {/* Jugs row */}
      <div className="flex items-end gap-10">
        {state.jugs.map((amount, i) => {
          const capacity = state.capacities[i]!;
          const waterHeight = (amount / capacity) * 100;
          const isSelected = selectedJug === i;
          const isFull = amount === capacity;
          const isEmpty = amount === 0;
          const canReceive = selectedJug !== null && selectedJug !== i && !isFull && state.jugs[selectedJug]! > 0;

          return (
            <div key={i} className="flex flex-col items-center gap-3">
              {/* Jug label */}
              <div className="text-sm font-semibold text-warm-stone-700">
                {t('waterJug.jug', { n: i + 1 })}
                <span className="ml-1 text-xs text-warm-stone-400 font-mono">
                  {amount}/{capacity}L
                </span>
              </div>

              {/* Jug container */}
              <div
                className={`
                  relative rounded-b-xl rounded-t-sm overflow-hidden
                  transition-all duration-200
                  ${isSelected ? 'ring-[3px] ring-logic-indigo-400 scale-105 shadow-lg shadow-logic-indigo-200' : ''}
                  ${isHighlighted(i) && !isSelected ? 'ring-2 ring-game-amber-400' : ''}
                  ${canReceive ? 'ring-2 ring-dashed ring-logic-indigo-300 cursor-pointer hover:ring-logic-indigo-500' : ''}
                  ${selectedJug === null ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
                  ${selectedJug !== null && !canReceive && !isSelected ? 'opacity-60' : ''}
                `}
                style={{ width: JUG_WIDTH, height: JUG_HEIGHT }}
                onClick={() => handleJugClick(i)}
                onDoubleClick={() => handleJugDoubleClick(i)}
                title={
                  selectedJug === null
                    ? t('waterJug.clickToPour')
                    : isSelected
                      ? t('waterJug.selected')
                      : canReceive
                        ? t('waterJug.clickTarget')
                        : ''
                }
              >
                {/* Glass background */}
                <div className="absolute inset-0 bg-gradient-to-b from-warm-stone-50/80 to-warm-stone-100/30 border-2 border-warm-stone-400/60 rounded-b-xl rounded-t-sm" />

                {/* Water fill */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-b-[10px]"
                  style={{ backgroundColor: WATER_COLOR }}
                  initial={false}
                  animate={{
                    height: `${waterHeight}%`,
                    opacity: amount > 0 ? 0.85 : 0,
                  }}
                  transition={{ duration: WATER_ANIM_DURATION, ease: 'easeInOut' }}
                >
                  {/* Water surface ripple */}
                  {amount > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-full" />
                  )}
                </motion.div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="bg-logic-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      {t('waterJug.selected')}
                    </span>
                  </motion.div>
                )}

                {/* Pour target indicator */}
                {canReceive && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-logic-indigo-500/10">
                    <span className="text-logic-indigo-600 text-xs font-bold">
                      {t('waterJug.clickTarget')}
                    </span>
                  </div>
                )}

                {/* Empty jug hint */}
                {isEmpty && selectedJug === null && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-warm-stone-400 text-xs opacity-60">{t('waterJug.clickToFill')}</span>
                  </div>
                )}

                {/* Target marker line */}
                {state.target <= capacity && !solved && (
                  <div
                    className="absolute left-0 right-0 border-t-[3px] border-dashed border-game-amber-500 z-20 pointer-events-none"
                    style={{ bottom: `${(state.target / capacity) * 100}%` }}
                  >
                    <span className="absolute -top-5 right-1 text-[10px] font-bold text-game-amber-600 bg-warm-stone-50/70 px-1 rounded">
                      🎯 {state.target}L
                    </span>
                  </div>
                )}
              </div>

              {/* Operation buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => handleFill(i, e)}
                  disabled={disabled || isFull}
                  className="px-3 py-2 text-sm font-semibold rounded-lg bg-clarity-teal-100 text-clarity-teal-700
                             hover:bg-clarity-teal-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-all shadow-sm"
                  title={`${t('waterJug.fill')} (${i + 1})`}
                >
                  {t('waterJug.fill')}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleEmpty(i, e)}
                  disabled={disabled || isEmpty}
                  className="px-3 py-2 text-sm font-semibold rounded-lg bg-warm-stone-200 text-warm-stone-700
                             hover:bg-warm-stone-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-all shadow-sm"
                  title={`${t('waterJug.empty')} (${i + 1})`}
                >
                  {t('waterJug.empty')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard hints */}
      <div className="text-[10px] text-warm-stone-400 flex flex-wrap justify-center gap-x-3 gap-y-0.5">
        {state.jugs.map((_, i) => (
          <span key={i}><kbd className="px-1 py-0.5 bg-warm-stone-100 rounded text-[10px] font-mono">{i + 1}</kbd> {t('waterJug.jug', { n: i + 1 })}</span>
        ))}
        <span><kbd className="px-1 py-0.5 bg-warm-stone-100 rounded text-[10px] font-mono">F</kbd> {t('waterJug.fill')}</span>
        <span><kbd className="px-1 py-0.5 bg-warm-stone-100 rounded text-[10px] font-mono">E</kbd> {t('waterJug.empty')}</span>
        <span><kbd className="px-1 py-0.5 bg-warm-stone-100 rounded text-[10px] font-mono">Esc</kbd> {t('waterJug.cancel')}</span>
      </div>
    </div>
  );
}
