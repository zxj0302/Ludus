import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGame } from '@ludus/games';
import { useGameStore } from '../stores/gameStore';
import { clearSolverRuntimeTimers } from '../stores/gameStoreSolverRuntime';
import { GameShell } from './GameShell';

export function GamePage() {
  const { t } = useTranslation();
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const resume = !!(location.state as { resume?: boolean } | null)?.resume;
  const loadGame = useGameStore(s => s.loadGame);
  const flushProgress = useGameStore(s => s.flushProgress);
  const storeGameId = useGameStore(s => s.gameId);
  const gameState = useGameStore(s => s.gameState);

  const gameExists = !!(gameId && getGame(gameId));

  useEffect(() => {
    if (gameId && gameExists) {
      loadGame(gameId, { resume });
    }
  }, [gameId, gameExists, resume, loadGame]);

  // 离开游戏页或切换 gameId 时保存进度并清理悬挂定时器；与 loadGame 分 effect，避免 Strict Mode 下 cleanup 干扰加载
  useEffect(() => {
    return () => {
      clearSolverRuntimeTimers();
      flushProgress();
    };
  }, [gameId, flushProgress]);

  if (!gameId) {
    return <div className="text-center py-20 text-warm-stone-500">{t('game.noGame')}</div>;
  }

  if (!gameExists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-warm-stone-600 font-medium">
          {t('game.notFound')}
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-warm-stone-200 hover:bg-warm-stone-300 text-warm-stone-800 text-sm font-medium transition-colors"
        >
          {t('game.backToHub')}
        </Link>
      </div>
    );
  }

  // 在 store 中 gameId 与 URL 一致之前不渲染 GameShell
  // 避免 state/gameId 不匹配导致的瞬态崩溃
  if (gameId !== storeGameId || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-warm-stone-500 animate-pulse">{t('game.loading')}</p>
      </div>
    );
  }

  return <GameShell gameId={gameId} />;
}
