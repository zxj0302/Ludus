// 游戏状态卡片 — 通过 GamePluginEntry.ui.statusCard 渲染，无需游戏分支

import type { GameState, Solution } from '@ludus/core';
import { getGameEntry } from '@ludus/games';

interface Props {
  gameId: string;
  gameState: GameState | null;
  solution: Solution | null;
}

export function StatusCard({ gameId, gameState, solution }: Props) {
  const entry = getGameEntry(gameId);
  const StatusCardComponent = entry?.ui?.statusCard;
  if (!StatusCardComponent || !gameState) return null;
  return <StatusCardComponent gameState={gameState} solution={solution} />;
}
