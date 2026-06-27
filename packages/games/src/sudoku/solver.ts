import type { SolverTrace, TraceStep, SolutionStats } from '@ludus/core';

// ── DLX Node ──────────────────────────────────────────

class DLXNode {
  left!: DLXNode;
  right!: DLXNode;
  up!: DLXNode;
  down!: DLXNode;
  column!: DLXColumn;
  rowIndex: number;

  constructor(col?: DLXColumn, rowIdx = -1) {
    this.left = this.right = this.up = this.down = this;
    this.rowIndex = rowIdx;
    if (col) this.column = col as DLXColumn;
    else this.column = this as unknown as DLXColumn;
  }
}

class DLXColumn extends DLXNode {
  size: number = 0;
  name: string;

  constructor(name: string) {
    super();
    (this as unknown as DLXNode).column = this;
    this.name = name;
  }
}

// ── Matrix Construction ───────────────────────────────

const N = 9;
const BOX = 3;
const NUM_COLS = N * N * 4;        // 324: cell + row-val + col-val + box-val

function getBox(r: number, c: number): number {
  return Math.floor(r / BOX) * BOX + Math.floor(c / BOX);
}

/** Row index for placing value v (1-9) at (r, c) */
function rowIdx(r: number, c: number, v: number): number {
  return r * 81 + c * 9 + v - 1;
}

/** Column indices (4 each) for the given row */
function colIndices(r: number, c: number, v: number): [number, number, number, number] {
  const b = getBox(r, c);
  return [
    r * N + c,              // cell (r,c)
    81 + r * N + (v - 1),   // row r has value v
    162 + c * N + (v - 1),  // col c has value v
    243 + b * N + (v - 1),  // box b has value v
  ];
}

interface DLXMatrix {
  header: DLXNode;
  columns: DLXColumn[];
  rows: DLXNode[];
}

function buildMatrix(): DLXMatrix {
  const header = new DLXNode();
  const columns: DLXColumn[] = [];
  const rows: DLXNode[] = [];

  // Create column headers
  for (let j = 0; j < NUM_COLS; j++) {
    const col = new DLXColumn(`c${j}`);
    columns.push(col);
    // Link into header row
    col.left = header.left;
    col.right = header;
    header.left.right = col;
    header.left = col;
  }

  // Create rows for each possible digit in each cell
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      for (let v = 1; v <= N; v++) {
        const idx = rowIdx(r, c, v);
        const cols = colIndices(r, c, v);

        const rowNode = new DLXNode(undefined, idx);
        rows.push(rowNode);

        for (const colIdx of cols) {
          const col = columns[colIdx]!;
          const node = new DLXNode(col, idx);
          // Link vertically into column
          node.up = col.up;
          node.down = col as unknown as DLXNode;
          col.up.down = node;
          col.up = node;
          col.size++;

          // Link horizontally into row
          node.left = rowNode.left;
          node.right = rowNode;
          rowNode.left.right = node;
          rowNode.left = node;
        }
      }
    }
  }

  return { header, columns, rows };
}

// ── Cover / Uncover ────────────────────────────────────

function cover(col: DLXColumn): void {
  // Remove column header from header row
  col.right.left = col.left;
  col.left.right = col.right;
  // For each row in this column
  for (let r = col.down; r !== (col as unknown as DLXNode); r = r.down) {
    // For each other column in this row
    for (let j = r.right; j !== r; j = j.right) {
      j.down.up = j.up;
      j.up.down = j.down;
      j.column.size--;
    }
  }
}

function uncover(col: DLXColumn): void {
  // For each row in this column (reverse order)
  for (let r = col.up; r !== (col as unknown as DLXNode); r = r.up) {
    for (let j = r.left; j !== r; j = j.left) {
      j.column.size++;
      j.down.up = j;
      j.up.down = j;
    }
  }
  col.right.left = col as unknown as DLXNode;
  col.left.right = col as unknown as DLXNode;
}

// ── Output types ──────────────────────────────────────

export interface SudokuSolution {
  solvable: boolean;
  /** Solved grid (81 cells) or null */
  grid: number[] | null;
  trace: SolverTrace;
  stats: SolutionStats;
}

// ── Search ────────────────────────────────────────────

interface SearchState {
  solution: number[] | null;
  steps: TraceStep[];
  nodesExplored: number;
  maxDepth: number;
  startTime: number;
  timeLimitMs: number;
}

function search(
  matrix: DLXMatrix,
  state: SearchState,
  depth: number,
  chosenRows: number[],
  limit: number,
  solutions: number[][] | null, // null = find first only; array = collect all
  initialGrid: number[],
): boolean {
  const { header } = matrix;

  if (state.timeLimitMs > 0 && performance.now() - state.startTime > state.timeLimitMs) {
    return solutions ? solutions.length >= limit : false;
  }

  // All columns covered → solution found
  if (header.right === header) {
    const solved = buildGridFromRows(chosenRows, initialGrid);
    if (solutions) {
      solutions.push(solved);
      return solutions.length >= limit;
    }
    state.solution = solved;
    state.steps.push({
      description: 'Solution found',
      data: { rows: [...chosenRows], depth },
    });
    return true;
  }

  // Choose column with smallest size (Knuth's heuristic)
  let bestCol: DLXColumn | null = null;
  let bestSize = Infinity;
  for (let c = header.right; c !== header; c = c.right) {
    const col = c as unknown as DLXColumn;
    if (col.size < bestSize) {
      bestSize = col.size;
      bestCol = col;
      if (bestSize <= 1) break; // optimal, stop searching
    }
  }

  if (!bestCol || bestSize === 0) {
    state.steps.push({
      description: `Dead end — column ${bestCol?.name ?? '?'} has no rows`,
      data: { depth, remainingCols: bestSize },
    });
    state.nodesExplored++;
    return false; // column with no rows → dead end
  }

  state.nodesExplored++;
  if (depth > state.maxDepth) state.maxDepth = depth;

  const col = bestCol;
  state.steps.push({
    description: `Choose column ${col.name} (size=${col.size}), depth=${depth}`,
    data: { columnName: col.name, size: col.size, depth },
  });

  cover(col);

  for (let r = col.down; r !== (col as unknown as DLXNode); r = r.down) {
    chosenRows.push(r.rowIndex);

    state.steps.push({
      description: `Try row ${r.rowIndex} at depth ${depth}`,
      data: { rowIndex: r.rowIndex, depth, action: 'try' },
    });

    // Cover all columns in this row
    for (let j = r.right; j !== r; j = j.right) {
      cover(j.column);
    }

    const found = search(matrix, state, depth + 1, chosenRows, limit, solutions, initialGrid);

    // Uncover all columns in this row (reverse order)
    for (let j = r.left; j !== r; j = j.left) {
      uncover(j.column);
    }

    chosenRows.pop();

    if (found) {
      uncover(col);
      return true;
    }

    state.steps.push({
      description: solutions
        ? `Backtrack from row ${r.rowIndex} at depth ${depth} (seeking more solutions)`
        : `Backtrack from row ${r.rowIndex} at depth ${depth}`,
      data: { rowIndex: r.rowIndex, depth, action: 'backtrack' },
    });
  }

  uncover(col);
  return false;
}

function buildGridFromRows(rows: number[], initialGrid?: number[]): number[] {
  const grid = initialGrid ? [...initialGrid] : new Array(81).fill(0);
  for (const ri of rows) {
    // rowIdx = r*81 + c*9 + v-1
    const r = Math.floor(ri / 81);
    const c = Math.floor((ri % 81) / 9);
    const v = (ri % 9) + 1;
    grid[r * 9 + c] = v;
  }
  return grid;
}

// ── Public API ────────────────────────────────────────

/**
 * Solve a Sudoku puzzle using DLX.
 * @param grid flat length-81 array, 0 = empty, 1-9 = filled
 * @returns SudokuSolution with solved grid and solver trace
 */
export function solveSudoku(grid: number[]): SudokuSolution {
  const startTime = performance.now();
  const matrix = buildMatrix();
  applyPreFilledRows(matrix, grid);

  const state: SearchState = {
    solution: null,
    steps: [],
    nodesExplored: 0,
    maxDepth: 0,
    startTime,
    timeLimitMs: 5000, // 5 second safety timeout
  };

  const chosenRows: number[] = [];
  search(matrix, state, 0, chosenRows, 1, null, grid);

  const timeMs = Math.round(performance.now() - startTime);
  const solvable = state.solution !== null;

  return {
    solvable,
    grid: state.solution,
    trace: {
      type: 'constraint-propagation',
      steps: state.steps,
      visualizationData: {
        matrixDesc: '729 rows × 324 columns (81 cell + 81 row-val + 81 col-val + 81 box-val)',
        totalRows: 729,
        totalCols: 324,
      },
    },
    stats: {
      nodesExplored: state.nodesExplored,
      timeMs,
      solutionLength: solvable ? countEmpty(grid) : -1,
      solverName: 'DLX (Algorithm X)',
      terminated: solvable ? 'solved' : 'exhausted',
    },
  };
}

/**
 * Count solutions up to a limit (for uniqueness checking).
 * @param grid flat length-81 array
 * @param limit stop counting at this number
 * @returns number of solutions found (capped at limit)
 */
export function countSudokuSolutions(grid: number[], limit: number = 2): number {
  const matrix = buildMatrix();
  applyPreFilledRows(matrix, grid);

  const state: SearchState = {
    solution: null,
    steps: [],
    nodesExplored: 0,
    maxDepth: 0,
    startTime: performance.now(),
    timeLimitMs: 10000,
  };

  const chosenRows: number[] = [];
  const solutions: number[][] = [];
  search(matrix, state, 0, chosenRows, limit, solutions, grid);
  return solutions.length;
}

/**
 * Validate that a grid has no immediate conflicts.
 */
export function validateSudoku(grid: number[]): boolean {
  const rows = Array.from({ length: 9 }, () => new Set<number>());
  const cols = Array.from({ length: 9 }, () => new Set<number>());
  const boxes = Array.from({ length: 9 }, () => new Set<number>());

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r * 9 + c]!;
      if (v === 0) continue;
      if (v < 1 || v > 9) return false;
      const b = getBox(r, c);
      if (rows[r]!.has(v) || cols[c]!.has(v) || boxes[b]!.has(v)) return false;
      rows[r]!.add(v);
      cols[c]!.add(v);
      boxes[b]!.add(v);
    }
  }
  return true;
}

/** Count empty cells in the grid */
function countEmpty(grid: number[]): number {
  return grid.filter(v => v === 0).length;
}

/** Cover the exact rows that match pre-filled cells (the specific val row for each given) */
function applyPreFilledRows(matrix: DLXMatrix, grid: number[]): void {
  const covered = new Set<number>(); // columns already covered
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const val = grid[r * N + c]!;
      if (val === 0) continue;
      const cols = colIndices(r, c, val);
      for (const colIdx of cols) {
        if (!covered.has(colIdx)) {
          cover(matrix.columns[colIdx]!);
          covered.add(colIdx);
        }
      }
    }
  }
}
