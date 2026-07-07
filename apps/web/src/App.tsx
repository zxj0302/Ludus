import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from './stores/gameStore';

export function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const isHub = location.pathname === '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-panel border-b border-white/60">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <span className="w-8 h-8 rounded-xl bg-logic-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              L
            </span>
            <div>
              <span className="text-lg font-bold text-warm-stone-800 group-hover:text-logic-indigo-700 transition-colors">
                {t('app.title')}
              </span>
              <span className="text-xs text-warm-stone-500 hidden sm:block -mt-0.5">
                {t('app.subtitle')}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isHub ? 'text-logic-indigo-700' : 'text-warm-stone-600 hover:text-warm-stone-800'
              }`}
            >
              {t('app.nav.hub')}
            </Link>
            <SoundToggle />
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-warm-stone-400">
        Ludus — MIT License — {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function SoundToggle() {
  const { t } = useTranslation();
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const toggleSound = useGameStore(s => s.toggleSound);

  return (
    <button
      type="button"
      onClick={toggleSound}
      className="w-8 h-8 rounded-btn flex items-center justify-center
                 bg-warm-stone-100 hover:bg-warm-stone-200 text-sm transition-colors"
      title={soundEnabled ? t('app.sound.mute') : t('app.sound.unmute')}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  );
}

function LanguageSwitcher() {
  const setLanguage = useGameStore(s => s.setLanguage);
  const language = useGameStore(s => s.language);

  return (
    <select
      value={language}
      onChange={e => setLanguage(e.target.value)}
      className="text-xs bg-warm-stone-100 border border-warm-stone-300 rounded-btn px-2.5 py-1.5
                 cursor-pointer font-medium text-warm-stone-700 hover:border-warm-stone-400 transition-colors"
    >
      <option value="zh-CN">中文</option>
      <option value="en">English</option>
    </select>
  );
}
