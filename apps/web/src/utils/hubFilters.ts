import type { GamePlugin } from '@ludus/core';

export interface HubFilterState {
  query: string;
  category: string | null;
}

/** Collect unique category keys from registered games, sorted by translated label. */
export function getHubCategories(
  games: GamePlugin[],
  t: (key: string) => string,
): string[] {
  const seen = new Set<string>();
  for (const game of games) {
    seen.add(game.metadata.category);
  }
  return [...seen].sort((a, b) => t(a).localeCompare(t(b)));
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function matchesQuery(
  game: GamePlugin,
  query: string,
  t: (key: string) => string,
): boolean {
  const q = normalize(query);
  if (!q) return true;

  const haystack = [
    t(game.metadata.nameKey),
    t(game.metadata.descriptionKey),
    t(game.metadata.category),
    ...game.metadata.tags,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

/** Filter games by search query and optional category. */
export function filterHubGames(
  games: GamePlugin[],
  { query, category }: HubFilterState,
  t: (key: string) => string,
): GamePlugin[] {
  return games.filter(game => {
    if (category && game.metadata.category !== category) return false;
    return matchesQuery(game, query, t);
  });
}
