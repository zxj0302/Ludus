import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useProgressStore } from '../stores/progressStore';
import { computeHubStats } from '../utils/hubStats';

export function HubStatsBar() {
  const { t } = useTranslation();
  const records = useProgressStore(s => s.records);
  const stats = useMemo(() => computeHubStats(records), [records]);

  const tiles = [
    { key: 'wins', icon: '🏆', label: t('hub.stats.totalWins'), value: stats.totalWins, accent: 'text-game-amber-700' },
    { key: 'plays', icon: '🎮', label: t('hub.stats.totalPlays'), value: stats.totalPlays, accent: 'text-logic-indigo-700' },
    { key: 'tried', icon: '📚', label: t('hub.stats.gamesTried'), value: stats.gamesTried, accent: 'text-warm-stone-800' },
    { key: 'cleared', icon: '✨', label: t('hub.stats.gamesCleared'), value: stats.gamesWon, accent: 'text-clarity-teal-dark' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mb-8"
      aria-label={t('hub.stats.title')}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-warm-stone-600">{t('hub.stats.title')}</h2>
        <span
          className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-warm-stone-100 text-warm-stone-500 border border-warm-stone-200"
          title={t('hub.stats.achievementsHint')}
        >
          {t('hub.stats.achievementsSoon')}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ key, icon, label, value, accent }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className="bento-card px-4 py-3 flex items-center gap-3"
          >
            <span className="text-xl shrink-0" aria-hidden>{icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-warm-stone-500 uppercase tracking-wide truncate">
                {label}
              </div>
              <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
