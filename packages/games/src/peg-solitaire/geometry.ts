import type { PegSolitaireMove } from './types';

export const HOLE_COUNT = 33;

/**
 * Standard English 7x7 cross board, indexed row-major across valid holes:
 *
 *     0  1  2
 *     3  4  5
 *  6  7  8  9 10 11 12
 * 13 14 15 16 17 18 19
 * 20 21 22 23 24 25 26
 *    27 28 29
 *    30 31 32
 */
export const CENTER_HOLE = 16;

/**
 * English algebraic label: columns a–g left→right, rows 1–7 top→bottom.
 * Center hole is **d4** (Beasley / recreational-math convention).
 */
export function holeNotation(hole: number): string {
  const coord = HOLE_COORDS[hole];
  if (!coord) return `?${hole}`;
  return `${'abcdefg'[coord.col]}${coord.row + 1}`;
}

export type HoleCoord = { row: number; col: number };

export const HOLE_COORDS: ReadonlyArray<HoleCoord> = [
  { row: 0, col: 2 },
  { row: 0, col: 3 },
  { row: 0, col: 4 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 2, col: 3 },
  { row: 2, col: 4 },
  { row: 2, col: 5 },
  { row: 2, col: 6 },
  { row: 3, col: 0 },
  { row: 3, col: 1 },
  { row: 3, col: 2 },
  { row: 3, col: 3 },
  { row: 3, col: 4 },
  { row: 3, col: 5 },
  { row: 3, col: 6 },
  { row: 4, col: 0 },
  { row: 4, col: 1 },
  { row: 4, col: 2 },
  { row: 4, col: 3 },
  { row: 4, col: 4 },
  { row: 4, col: 5 },
  { row: 4, col: 6 },
  { row: 5, col: 2 },
  { row: 5, col: 3 },
  { row: 5, col: 4 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
];

const HOLE_BY_COORD = new Map(HOLE_COORDS.map((coord, hole) => [`${coord.row},${coord.col}`, hole]));
const DIRECTIONS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
] as const;

function holeAt(row: number, col: number): number | undefined {
  return HOLE_BY_COORD.get(`${row},${col}`);
}

function buildJumps(): PegSolitaireMove[] {
  const jumps: PegSolitaireMove[] = [];

  for (let from = 0; from < HOLE_COORDS.length; from += 1) {
    const coord = HOLE_COORDS[from]!;
    for (const { dr, dc } of DIRECTIONS) {
      const over = holeAt(coord.row + dr, coord.col + dc);
      const to = holeAt(coord.row + dr * 2, coord.col + dc * 2);
      if (over !== undefined && to !== undefined) {
        jumps.push({ from, over, to });
      }
    }
  }

  return jumps;
}

export const JUMPS: ReadonlyArray<PegSolitaireMove> = buildJumps();

type CoordTransform = (coord: HoleCoord) => HoleCoord;

const D4_TRANSFORMS: ReadonlyArray<CoordTransform> = [
  ({ row, col }) => ({ row, col }),
  ({ row, col }) => ({ row: col, col: 6 - row }),
  ({ row, col }) => ({ row: 6 - row, col: 6 - col }),
  ({ row, col }) => ({ row: 6 - col, col: row }),
  ({ row, col }) => ({ row, col: 6 - col }),
  ({ row, col }) => ({ row: 6 - row, col }),
  ({ row, col }) => ({ row: col, col: row }),
  ({ row, col }) => ({ row: 6 - col, col: 6 - row }),
] as const;

function buildPermutation(transform: CoordTransform): number[] {
  return HOLE_COORDS.map(coord => {
    const mapped = transform(coord);
    const hole = holeAt(mapped.row, mapped.col);
    if (hole === undefined) {
      throw new Error(`Invalid English-board symmetry at ${mapped.row},${mapped.col}`);
    }
    return hole;
  });
}

export const D4_PERMUTATIONS: ReadonlyArray<ReadonlyArray<number>> = D4_TRANSFORMS.map(buildPermutation);
