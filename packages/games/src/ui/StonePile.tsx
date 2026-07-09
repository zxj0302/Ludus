import React from 'react';

const STONE_W = 48;
const STONE_H = 36;
const STONE_STEP = 30;

const GRADIENTS = [
  'radial-gradient(circle at 35% 30%, #f5f2ee, #c4bdb2 50%, #8c8273 100%)',
  'radial-gradient(circle at 35% 30%, #f0ede7, #bdb5a7 50%, #857968 100%)',
  'radial-gradient(circle at 35% 30%, #f3efe9, #c2b9aa 50%, #8a7d6c 100%)',
  'radial-gradient(circle at 35% 30%, #f2eee7, #c0b6a5 50%, #877a68 100%)',
  'radial-gradient(circle at 35% 30%, #f4f0eb, #c6bcad 50%, #8e8170 100%)',
];

const SHADOW = '0 1px 3px rgba(0,0,0,0.2), inset 0 -2px 3px rgba(0,0,0,0.1)';

export interface StonePileProps {
  count: number;
  pileIndex: number;
  maxVisible: number;
  canInteract: boolean;
  isHinted: boolean;
  hintRemoveCount: number | null;
  /** When false, hint ring is suppressed (e.g. Wythoff "both" hint mode) */
  hintActive?: boolean;
  onStoneClick: (idx: number) => void;
  ariaLabelFn: (removeCount: number, remain: number) => string;
}

export function StonePile({
  count, pileIndex, maxVisible, canInteract, isHinted, hintRemoveCount,
  hintActive = true, onStoneClick, ariaLabelFn,
}: StonePileProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const containerH = maxVisible > 0 ? (maxVisible - 1) * STONE_STEP + STONE_H : 0;

  if (count === 0) {
    return (
      <div className="relative mx-auto" style={{ width: STONE_W, height: containerH }} />
    );
  }

  const gradient = GRADIENTS[pileIndex % GRADIENTS.length]!;
  const visible = Math.min(count, maxVisible);
  const stones: React.ReactNode[] = [];

  for (let idx = visible - 1; idx >= 0; idx--) {
    const top = containerH - STONE_H - idx * STONE_STEP;
    const removeCount = count - idx;
    const hoveredThisPile = hover !== null && hover >= removeCount;
    const isHintStone = hintActive && isHinted && removeCount === hintRemoveCount;

    let extraClass = '';
    let boxShadow = SHADOW;
    let z = idx;

    if (isHintStone) {
      extraClass = 'ring-[3px] ring-game-amber-400 scale-110';
      boxShadow = '0 0 0 4px rgba(232,168,56,0.5), ' + SHADOW;
      z = 50;
    } else if (hoveredThisPile && canInteract) {
      extraClass = 'brightness-75 scale-105';
      z = idx + 20;
    }

    stones.push(
      <button
        key={idx}
        type="button"
        onClick={() => onStoneClick(idx)}
        onMouseEnter={() => canInteract ? setHover(removeCount) : null}
        onMouseLeave={() => setHover(null)}
        disabled={!canInteract}
        className={`absolute rounded-full border border-white/20 transition-all duration-150 cursor-pointer
          ${extraClass} ${canInteract ? 'hover:brightness-90' : ''}`}
        style={{
          left: 0, top: `${top}px`, width: STONE_W, height: STONE_H,
          background: gradient, boxShadow, zIndex: z,
        }}
        aria-label={ariaLabelFn(removeCount, count - removeCount)}
      />,
    );
  }

  if (count > maxVisible) {
    stones.push(
      <span
        key="overflow"
        className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[11px] text-warm-stone-500 font-bold"
      >
        +{count - maxVisible}
      </span>,
    );
  }

  return (
    <div className="relative mx-auto" style={{ width: STONE_W, height: containerH }}>
      {stones}
    </div>
  );
}

export { STONE_W, STONE_H, STONE_STEP };
