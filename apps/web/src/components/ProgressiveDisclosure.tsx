import { useTranslation } from 'react-i18next';
import type { DisclosureLevel } from '../stores/gameStore';

interface Props {
  currentLevel: DisclosureLevel;
  onChangeLevel: (level: DisclosureLevel) => void;
  onOpenEducation: () => void;
  isWin: boolean;
}

export function ProgressiveDisclosure({
  currentLevel, onChangeLevel, onOpenEducation, isWin,
}: Props) {
  const { t } = useTranslation();

  const handleLevelClick = (level: DisclosureLevel) => {
    onChangeLevel(level);
    if (level >= 2) onOpenEducation();
  };

  return (
    <div className="bento-card p-3 flex items-center justify-center gap-1.5">
      {([1, 2, 3] as DisclosureLevel[]).map(level => {
        // level === currentLevel → 最亮（用户正选中）
        // level < currentLevel → 半亮（已激活但不是当前焦点）
        // level > currentLevel → 灰（未激活）
        const isPeak = level === currentLevel;
        const isActive = level <= currentLevel;

        return (
          <button
            key={level}
            type="button"
            onClick={() => handleLevelClick(level)}
            className={`
              px-4 py-2 rounded-btn text-sm font-semibold transition-all duration-200
              ${isPeak
                ? 'bg-logic-indigo-600 text-white shadow-md ring-2 ring-logic-indigo-300 scale-105'
                : isActive
                  ? 'bg-logic-indigo-300/60 text-logic-indigo-800'
                  : 'bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200'
              }
            `}
          >
            {t(`disclosure.l${level}`)}
          </button>
        );
      })}

      {isWin && currentLevel === 1 && (
        <button
          type="button"
          onClick={() => handleLevelClick(2)}
          className="text-xs text-logic-indigo-600 hover:text-logic-indigo-700 font-medium underline underline-offset-2 ml-2"
        >
          {t('disclosure.hint.l2')}
        </button>
      )}
      {isWin && currentLevel === 2 && (
        <button
          type="button"
          onClick={() => handleLevelClick(3)}
          className="text-xs text-logic-indigo-600 hover:text-logic-indigo-700 font-medium underline underline-offset-2 ml-2"
        >
          {t('disclosure.hint.l3')}
        </button>
      )}
    </div>
  );
}
