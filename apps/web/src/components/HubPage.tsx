import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getAllGames } from '@ludus/games';
import { filterHubGames, getHubCategories } from '../utils/hubFilters';
import { HubHeroCard } from './HubHeroCard';
import { HubStatsBar } from './HubStatsBar';

export function HubPage() {
  const { t } = useTranslation();
  const games = getAllGames();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => getHubCategories(games, t), [games, t]);

  const filtered = useMemo(
    () => filterHubGames(games, { query, category }, t),
    [games, query, category, t],
  );

  const hasActiveFilter = query.trim().length > 0 || category !== null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-warm-stone-800 mb-3">{t('app.title')}</h1>
        <p className="text-lg text-warm-stone-500">{t('app.subtitle')}</p>
      </div>

      <HubHeroCard />

      <HubStatsBar />

      {/* Search + filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <label htmlFor="hub-search" className="sr-only">{t('hub.search')}</label>
          <input
            id="hub-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('hub.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-card border border-warm-stone-200
                       bg-white text-warm-stone-800 placeholder:text-warm-stone-400
                       focus:outline-none focus:ring-2 focus:ring-logic-indigo-300 focus:border-logic-indigo-400
                       transition-shadow"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-stone-400 pointer-events-none" aria-hidden>
            🔍
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-warm-stone-500 mr-1">{t('hub.filterBy')}</span>
          <CategoryChip
            active={category === null}
            label={t('hub.filterAll')}
            onClick={() => setCategory(null)}
          />
          {categories.map(cat => (
            <CategoryChip
              key={cat}
              active={category === cat}
              label={t(cat)}
              onClick={() => setCategory(prev => (prev === cat ? null : cat))}
            />
          ))}
        </div>

        <p className="text-sm text-warm-stone-500">
          {hasActiveFilter
            ? t('hub.resultCount', { count: filtered.length, total: games.length })
            : t('hub.gameCount', { count: games.length })}
        </p>
      </div>

      <h2 className="text-xl font-semibold text-warm-stone-700 mb-6">{t('hub.title')}</h2>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((game, i) => (
            <motion.div
              key={game.metadata.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Link
                to={`/game/${game.metadata.id}`}
                state={{ resume: false }}
                className="bento-card p-6 no-underline group cursor-pointer
                           hover:shadow-card-hover hover:-translate-y-1
                           transition-all duration-200 flex flex-col items-center text-center h-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-logic-indigo-100 flex items-center justify-center text-2xl
                                group-hover:bg-logic-indigo-200 group-hover:scale-105 transition-all mb-4">
                  {game.metadata.icon ?? '🎮'}
                </div>

                <h3 className="text-xl font-bold text-warm-stone-800 group-hover:text-logic-indigo-700 transition-colors mb-2">
                  {t(game.metadata.nameKey)}
                </h3>

                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-logic-indigo-100 text-logic-indigo-700 font-medium mb-2">
                  {t(game.metadata.category)}
                </span>

                <p className="text-xs text-warm-stone-500 leading-relaxed mb-4 flex-1">
                  {t(game.metadata.descriptionKey)}
                </p>

                <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-btn
                                 bg-logic-indigo-600 text-white text-sm font-semibold
                                 group-hover:bg-logic-indigo-700 transition-colors shadow-sm">
                  {t('hub.play')} →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="text-center py-16 bento-card">
          <div className="text-4xl mb-4">🔎</div>
          <p className="text-lg font-medium text-warm-stone-700 mb-2">{t('hub.noResults')}</p>
          <p className="text-sm text-warm-stone-500 mb-6">{t('hub.noResultsHint')}</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setCategory(null); }}
            className="px-5 py-2 rounded-btn bg-logic-indigo-600 text-white text-sm font-semibold
                       hover:bg-logic-indigo-700 transition-colors"
          >
            {t('hub.clearFilters')}
          </button>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-lg text-warm-stone-500">{t('hub.comingSoon')}</p>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
        active
          ? 'bg-logic-indigo-600 text-white shadow-sm'
          : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'
      }`}
    >
      {label}
    </button>
  );
}
