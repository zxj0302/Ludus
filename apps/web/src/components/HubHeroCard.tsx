import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getGame } from '@ludus/games';
import { useProgressStore } from '../stores/progressStore';
import { computeProgressPercent } from '../utils/progressSnapshot';

export function HubHeroCard() {
  const { t } = useTranslation();
  const recentGameId = useProgressStore(s => s.recentGameId);
  const record = useProgressStore(s => (recentGameId ? s.records[recentGameId] : undefined));

  if (!record) return null;

  const game = getGame(record.gameId);
  if (!game) return null;

  const progress = computeProgressPercent(
    record.isSolved,
    record.snapshot.stepCount,
    record.optimalSteps,
  );

  const statusLabel = record.isSolved
    ? t('hub.heroCompleted')
    : t('hub.heroInProgress');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-10"
    >
      <Link
        to={`/game/${record.gameId}`}
        state={{ resume: true }}
        className="bento-card block p-6 sm:p-8 no-underline group
                   hover:shadow-card-hover transition-all duration-200
                   bg-gradient-to-br from-logic-indigo-50 to-warm-stone-50"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-logic-indigo-100 flex items-center justify-center text-3xl shrink-0
                            group-hover:bg-logic-indigo-200 group-hover:scale-105 transition-all">
              {game.metadata.icon ?? '🎮'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-logic-indigo-600 uppercase tracking-wide mb-1">
                {t('hub.continuePlaying')}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-warm-stone-800 group-hover:text-logic-indigo-700 transition-colors truncate">
                {t(game.metadata.nameKey)}
              </h2>
              <p className="text-sm text-warm-stone-500 mt-1">
                {statusLabel}
                {record.wins > 0 && (
                  <span className="ml-2 text-game-amber-700">
                    · {t('hub.wins', { count: record.wins })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:w-48 shrink-0">
            <div className="flex justify-between text-xs text-warm-stone-500">
              <span>{t('hub.progress')}</span>
              <span className="font-mono font-semibold text-warm-stone-700">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-warm-stone-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-logic-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-btn mt-1
                             bg-logic-indigo-600 text-white text-sm font-semibold
                             group-hover:bg-logic-indigo-700 transition-colors shadow-sm">
              {record.isSolved ? t('hub.playAgain') : t('hub.continue')} →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
