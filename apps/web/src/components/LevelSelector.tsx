import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Collection } from '../types/levelCollection';

interface Props {
  collections: Collection<unknown>[];
  selectedCollection: string;
  selectedLevelIdx: number;
  totalInCollection: number;
  onCollectionChange: (name: string) => void;
  onLevelSelect: (index: number) => void;
  /** Optional: replace default "n / total" option labels (e.g. named peg puzzles). */
  formatLevelOption?: (index: number, total: number) => string;
  /** Optional label for the collection row (default: levelSelector.collection). */
  collectionLabelKey?: string;
}

export function LevelSelector({
  collections, selectedCollection, selectedLevelIdx,
  totalInCollection,
  onCollectionChange, onLevelSelect,
  formatLevelOption,
  collectionLabelKey = 'levelSelector.collection',
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 用 document-level mousedown + ref.contains 关闭 popover
  // 比 backdrop div 更可靠：能正确处理原生 <select> 下拉菜单的点击
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback((idx: number) => {
    onLevelSelect(idx);
    setOpen(false);
  }, [onLevelSelect]);

  const currentColl = collections.find(c => c.name === selectedCollection);
  const collShort = currentColl?.shortLabel ?? currentColl?.label ?? '';
  const label = currentColl
    ? `${collShort} ${selectedLevelIdx + 1}/${totalInCollection}`
    : t('levelSelector.select');

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3 py-1 rounded-btn text-xs font-medium bg-warm-stone-100 text-warm-stone-700 hover:bg-warm-stone-200 transition-colors"
      >
        {label} ▾
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-xl border border-warm-stone-200 p-3 min-w-[260px]"
        >
          {/* 合集选择 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-warm-stone-400 shrink-0">{t(collectionLabelKey)}</span>
            <select
              value={selectedCollection}
              onChange={e => onCollectionChange(e.target.value)}
              className="flex-1 px-2 py-1 rounded text-xs font-medium bg-logic-indigo-50 text-logic-indigo-700 border border-logic-indigo-200 cursor-pointer"
            >
              {collections.map(c => (
                <option key={c.name} value={c.name}>{c.label} ({c.levels.length})</option>
              ))}
            </select>
          </div>

          {/* 关卡选择 */}
          <div className="flex items-center gap-2">
            <span className="text-warm-stone-400 shrink-0">{t('levelSelector.level')}</span>
            <button
              type="button" onClick={() => onLevelSelect(Math.max(0, selectedLevelIdx - 1))}
              disabled={selectedLevelIdx <= 0}
              className="px-2 py-1 rounded bg-warm-stone-100 hover:bg-warm-stone-200 disabled:opacity-30"
            >◀</button>
            <select
              value={selectedLevelIdx}
              onChange={e => handleSelect(Number(e.target.value))}
              className="flex-1 px-2 py-1 rounded text-xs font-medium bg-warm-stone-100 text-warm-stone-700 border border-warm-stone-300 cursor-pointer"
            >
              {Array.from({ length: totalInCollection }, (_, i) => (
                <option key={i} value={i}>
                  {formatLevelOption
                    ? formatLevelOption(i, totalInCollection)
                    : `${i + 1} / ${totalInCollection}`}
                </option>
              ))}
            </select>
            <button
              type="button" onClick={() => onLevelSelect(Math.min(totalInCollection - 1, selectedLevelIdx + 1))}
              disabled={selectedLevelIdx >= totalInCollection - 1}
              className="px-2 py-1 rounded bg-warm-stone-100 hover:bg-warm-stone-200 disabled:opacity-30"
            >▶</button>
          </div>
        </div>
      )}
    </div>
  );
}
