import { CENTER_HOLE, HOLE_COUNT } from './geometry';
import { legalMoves, meetsGoal, popcount } from './rules';
import type { PegCatalogTier, PegGoal, PegSolitaireState } from './types';

export interface PegCatalogEntry {
  id: string;
  /** i18n key under pegSolitaire.level.* */
  titleKey: string;
  /** Provenance note for docs / education (not shown as raw UI unless keyed). */
  source: string;
  pegs: number;
  goal: PegGoal;
  /** Legacy metadata only — UI no longer shelves by tier (ADR-026 / v1.2). */
  tier: PegCatalogTier;
  /** Single-jump count when known; classic uses 31 (not Bergholt's 18 multi-jump count). */
  knownSolutionLength: number | null;
}

function bit(hole: number): number {
  return 2 ** hole;
}

function bits(...holes: number[]): number {
  return holes.reduce((mask, hole) => mask + bit(hole), 0);
}

function vacate(hole: number): number {
  return 2 ** HOLE_COUNT - 1 - bit(hole);
}

function asState(pegs: number, goal: PegGoal): PegSolitaireState {
  const draft: PegSolitaireState = { pegs, goal, status: 'playing' };
  if (meetsGoal(pegs, goal)) return { ...draft, status: 'won' };
  if (legalMoves(draft).length === 0) return { ...draft, status: 'stuck' };
  return draft;
}

const CLASSIC_PEGS = vacate(CENTER_HOLE);

/**
 * Classic English center-vacant start — cultural main entry for one-center.
 * Literature often quotes Bergholt's 18 *multi-jump* moves; we store single-jump length 31.
 */
export const CLASSIC_CENTER_EMPTY: PegCatalogEntry = {
  id: 'classic-center-vacant',
  titleKey: 'pegSolitaire.level.classicCenterVacant',
  source: 'Traditional English board; center vacant → center finish (Beasley / recreational math)',
  pegs: CLASSIC_PEGS,
  goal: 'one-center',
  tier: 'hard',
  knownSolutionLength: 31,
};

/**
 * Classic / textbook English-board figures.
 * Modes filter by `goal`: a layout may be solvable for one-any but not one-center (common).
 * Sources: Beasley-style figure play, van Delft/Botermans patterns, mathematische-basteleien
 * “Pattern at the Beginning”, warehouse-verified with our solver.
 */
export const PEG_CATALOG: readonly PegCatalogEntry[] = [
  // ── one-any: short micros ──
  {
    id: 'row-top-one-jump',
    titleKey: 'pegSolitaire.level.rowTopOneJump',
    source: 'Micro endgame; warehouse-verified',
    pegs: bits(0, 1),
    goal: 'one-any',
    tier: 'easy',
    knownSolutionLength: 1,
  },
  {
    id: 'center-gate-pair',
    titleKey: 'pegSolitaire.level.centerGatePair',
    source: 'Center-file approach pair; warehouse-verified',
    pegs: bits(14, 15),
    goal: 'one-any',
    tier: 'easy',
    knownSolutionLength: 1,
  },
  {
    id: 't-shape',
    titleKey: 'pegSolitaire.level.tShape',
    source: 'T / trident micro; warehouse-verified',
    pegs: bits(8, 9, 10, 15),
    goal: 'one-any',
    tier: 'easy',
    knownSolutionLength: 3,
  },
  {
    id: 'plus-five',
    titleKey: 'pegSolitaire.level.plusFive',
    source: 'Plus-arm micro; warehouse-verified',
    pegs: bits(8, 9, 10, 15, 16),
    goal: 'one-any',
    tier: 'easy',
    knownSolutionLength: 4,
  },
  {
    id: 'cross-arms',
    titleKey: 'pegSolitaire.level.crossArms',
    source: 'Seven-hole cross arms (no center peg); warehouse-verified',
    pegs: bits(4, 9, 14, 15, 17, 18, 23),
    goal: 'one-any',
    tier: 'easy',
    knownSolutionLength: 6,
  },

  // ── one-any: named textbook figures ──
  {
    id: 'greek-cross',
    titleKey: 'pegSolitaire.level.greekCross',
    source: 'Greek Cross figure (equal arms); classic pattern puzzle → leave one',
    pegs: bits(1, 4, 7, 8, 9, 10, 11, 16, 23),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 8,
  },
  {
    id: 'plus-seven',
    titleKey: 'pegSolitaire.level.plusSeven',
    source: 'Plus / Greek-lite through mid-file; warehouse-verified',
    pegs: bits(4, 9, 14, 15, 16, 17, 18, 23),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 7,
  },
  {
    id: 'pyramid-north',
    titleKey: 'pegSolitaire.level.pyramidNorth',
    source: 'Northern pyramid figure; textbook beginner pattern',
    pegs: bits(1, 3, 4, 5, 7, 8, 9, 10, 11),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 8,
  },
  {
    id: 'arrow',
    titleKey: 'pegSolitaire.level.arrow',
    source: 'Arrow / chevron figure pointing north; classic residual',
    pegs: bits(1, 4, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 11,
  },
  {
    id: 'arrow-compact',
    titleKey: 'pegSolitaire.level.arrowCompact',
    source: 'Compact arrow (no wing tips); warehouse-verified',
    pegs: bits(1, 4, 8, 9, 10, 14, 15, 16, 17, 18),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 9,
  },
  {
    id: 'diamond',
    titleKey: 'pegSolitaire.level.diamond',
    source: 'Small diamond / lozenge around center; classic pattern',
    pegs: bits(4, 8, 9, 10, 14, 15, 17, 18, 22, 23, 24),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 10,
  },
  {
    id: 'house',
    titleKey: 'pegSolitaire.level.house',
    source: 'House / cottage mid-board figure (teaching pattern)',
    pegs: bits(7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 22, 23, 24),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 12,
  },
  {
    id: 'wedge-nw',
    titleKey: 'pegSolitaire.level.wedgeNw',
    source: 'Northwest wedge residual; warehouse-verified',
    pegs: bits(0, 1, 3, 4, 6, 7, 8, 9, 13, 14, 15),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 10,
  },
  {
    id: 'wedge-ne',
    titleKey: 'pegSolitaire.level.wedgeNe',
    source: 'Northeast wedge residual; warehouse-verified',
    pegs: bits(1, 2, 4, 5, 9, 10, 11, 12, 15, 16, 17),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 10,
  },
  {
    id: 'north-half',
    titleKey: 'pegSolitaire.level.northHalf',
    source: 'Northern half-board clear-down; warehouse-verified',
    pegs: bits(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 12,
  },
  {
    id: 'big-diamond',
    titleKey: 'pegSolitaire.level.bigDiamond',
    source: 'Large diamond pattern (German recreational “big diamond” family)',
    pegs: bits(1, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 19,
  },
  {
    id: 'north-cluster',
    titleKey: 'pegSolitaire.level.northCluster',
    source: 'Northern cluster residual; warehouse-verified',
    pegs: bits(1, 2, 3, 4, 8, 9),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 5,
  },
  {
    id: 'west-elbow',
    titleKey: 'pegSolitaire.level.westElbow',
    source: 'West-arm elbow residual; warehouse-verified',
    pegs: bits(0, 3, 4, 6, 7, 9),
    goal: 'one-any',
    tier: 'medium',
    knownSolutionLength: 5,
  },
  {
    id: 'vacate-sw-corner',
    titleKey: 'pegSolitaire.level.vacateSwCorner',
    source: 'Single-vacancy: empty SW corner tip → leave one (English complement family)',
    pegs: vacate(30),
    goal: 'one-any',
    tier: 'hard',
    knownSolutionLength: 31,
  },

  // ── one-center: classic + center-finish figures ──
  CLASSIC_CENTER_EMPTY,
  {
    id: 'vacate-south-tip',
    titleKey: 'pegSolitaire.level.vacateSouthTip',
    source: 'Single-vacancy: empty south tip → finish center (English board)',
    pegs: vacate(31),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 31,
  },
  {
    id: 'center-star',
    titleKey: 'pegSolitaire.level.centerStar',
    source: 'Latin-star / extended plus → center finish; warehouse-verified',
    pegs: bits(4, 9, 14, 15, 16, 17, 18, 23, 28),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 8,
  },
  {
    id: 'three-jump-center',
    titleKey: 'pegSolitaire.level.threeJumpCenter',
    source: 'Short center-finish cross; warehouse-verified',
    pegs: bits(4, 14, 15, 23),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 3,
  },
  {
    id: 'three-jump-center-e',
    titleKey: 'pegSolitaire.level.threeJumpCenterE',
    source: 'D4 rotate of three-jump-center; warehouse-verified',
    pegs: bits(4, 9, 15, 18),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 3,
  },
  {
    id: 'three-jump-center-w',
    titleKey: 'pegSolitaire.level.threeJumpCenterW',
    source: 'D4 rotate of three-jump-center; warehouse-verified',
    pegs: bits(4, 9, 14, 17),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 3,
  },
  {
    id: 'three-jump-center-s',
    titleKey: 'pegSolitaire.level.threeJumpCenterS',
    source: 'D4 rotate of three-jump-center; warehouse-verified',
    pegs: bits(9, 17, 18, 28),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 3,
  },
  {
    id: 'six-peg-center',
    titleKey: 'pegSolitaire.level.sixPegCenter',
    source: 'Six-peg center-finish residual; warehouse-verified',
    pegs: bits(0, 3, 4, 8, 16, 23),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 5,
  },
  {
    id: 'six-peg-center-e',
    titleKey: 'pegSolitaire.level.sixPegCenterE',
    source: 'D4 rotate of six-peg-center; warehouse-verified',
    pegs: bits(2, 4, 5, 10, 16, 23),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 5,
  },
  {
    id: 'north-to-center',
    titleKey: 'pegSolitaire.level.northToCenter',
    source: 'Northern cluster → center; warehouse-verified',
    pegs: bits(1, 2, 3, 4, 8, 9),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 5,
  },
  {
    id: 'south-to-center',
    titleKey: 'pegSolitaire.level.southToCenter',
    source: 'D4 rotate of north-to-center; warehouse-verified',
    pegs: bits(23, 24, 28, 29, 30, 31),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 5,
  },
  {
    id: 'west-to-center',
    titleKey: 'pegSolitaire.level.westToCenter',
    source: 'West elbow → center; warehouse-verified',
    pegs: bits(0, 3, 4, 6, 7, 9),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 5,
  },
  {
    id: 'east-to-center',
    titleKey: 'pegSolitaire.level.eastToCenter',
    source: 'D4 rotate of west-to-center; warehouse-verified',
    pegs: bits(2, 4, 5, 9, 11, 12),
    goal: 'one-center',
    tier: 'hard',
    knownSolutionLength: 5,
  },
];

export function catalogByGoal(goal: PegGoal): PegCatalogEntry[] {
  const entries = PEG_CATALOG.filter(entry => entry.goal === goal);
  return entries.sort((a, b) => {
    if (goal === 'one-center') {
      if (a.id === CLASSIC_CENTER_EMPTY.id) return -1;
      if (b.id === CLASSIC_CENTER_EMPTY.id) return 1;
    }
    const byPegs = popcount(a.pegs) - popcount(b.pegs);
    if (byPegs !== 0) return byPegs;
    return a.id.localeCompare(b.id);
  });
}

export function catalogByTier(tier: PegCatalogTier): PegCatalogEntry[] {
  return PEG_CATALOG.filter(entry => entry.tier === tier);
}

export function entryToState(entry: PegCatalogEntry): PegSolitaireState {
  return { ...asState(entry.pegs, entry.goal), catalogId: entry.id };
}

export function catalogStats(): {
  easy: number;
  medium: number;
  hard: number;
  oneAny: number;
  oneCenter: number;
  total: number;
} {
  return {
    easy: catalogByTier('easy').length,
    medium: catalogByTier('medium').length,
    hard: catalogByTier('hard').length,
    oneAny: catalogByGoal('one-any').length,
    oneCenter: catalogByGoal('one-center').length,
    total: PEG_CATALOG.length,
  };
}
