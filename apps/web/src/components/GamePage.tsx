import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
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

  useEffect(() => {
    if (gameId) {
      loadGame(gameId, { resume });
    }
  }, [gameId, resume, loadGame]);

  // 离开游戏页或切换 gameId 时保存进度；与 loadGame 分 effect，避免 Strict Mode 下 cleanup 干扰加载
  useEffect(() => {
    return () => {
      flushProgress();
    };
  }, [gameId, flushProgress]);

  if (!gameId) {
    return <div className="text-center py-20 text-warm-stone-500">{t('game.noGame')}</div>;
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
