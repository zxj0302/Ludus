import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import { GameShell } from './GameShell';

export function GamePage() {
  const { t } = useTranslation();
  const { gameId } = useParams<{ gameId: string }>();
  const loadGame = useGameStore(s => s.loadGame);
  const storeGameId = useGameStore(s => s.gameId);
  const gameState = useGameStore(s => s.gameState);

  useEffect(() => {
    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

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
