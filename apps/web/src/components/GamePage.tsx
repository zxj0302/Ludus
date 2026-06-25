import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import { GameShell } from './GameShell';

export function GamePage() {
  const { t } = useTranslation();
  const { gameId } = useParams<{ gameId: string }>();
  const loadGame = useGameStore(s => s.loadGame);
  const currentGameId = useGameStore(s => s.gameId);

  useEffect(() => {
    if (gameId && gameId !== currentGameId) {
      loadGame(gameId);
    }
  }, [gameId, currentGameId, loadGame]);

  if (!gameId) {
    return <div className="text-center py-20 text-warm-stone-500">{t('game.noGame')}</div>;
  }

  return <GameShell gameId={gameId} />;
}
