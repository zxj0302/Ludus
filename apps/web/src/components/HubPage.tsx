import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllGames } from '@ludus/games';

export function HubPage() {
  const { t } = useTranslation();
  const games = getAllGames();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-warm-stone-800 mb-3">{t('app.title')}</h1>
        <p className="text-lg text-warm-stone-500">{t('app.subtitle')}</p>
      </div>

      <h2 className="text-xl font-semibold text-warm-stone-700 mb-6">{t('hub.title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map(game => (
          <Link
            key={game.metadata.id}
            to={`/game/${game.metadata.id}`}
            className="bento-card p-6 no-underline group cursor-pointer
                       hover:shadow-card-hover hover:-translate-y-1
                       transition-all duration-200 flex flex-col items-center text-center"
          >
            {/* Logo — biggest element */}
            <div className="w-16 h-16 rounded-2xl bg-logic-indigo-100 flex items-center justify-center text-2xl
                            group-hover:bg-logic-indigo-200 group-hover:scale-105 transition-all mb-4">
              {game.metadata.icon ?? '🎮'}
            </div>

            {/* Game name — most prominent text */}
            <h3 className="text-xl font-bold text-warm-stone-800 group-hover:text-logic-indigo-700 transition-colors mb-2">
              {t(game.metadata.nameKey)}
            </h3>

            {/* Category as a small tag */}
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-logic-indigo-100 text-logic-indigo-700 font-medium mb-2">
              {t(game.metadata.category)}
            </span>

            {/* Description */}
            <p className="text-xs text-warm-stone-500 leading-relaxed mb-4">
              {t(game.metadata.descriptionKey)}
            </p>

            {/* Play button */}
            <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-btn
                             bg-logic-indigo-600 text-white text-sm font-semibold
                             group-hover:bg-logic-indigo-700 transition-colors shadow-sm">
              {t('hub.play')} →
            </span>
          </Link>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-lg text-warm-stone-500">{t('hub.comingSoon')}</p>
        </div>
      )}
    </div>
  );
}
