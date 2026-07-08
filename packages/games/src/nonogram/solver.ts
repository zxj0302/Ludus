import type { Solution, SolverTrace } from '@ludus/core';
import type { NonogramState, CellState } from './types';
import { EMPTY, FILLED, CROSS } from './types';

// ═══════════════════════════════════════════════════════════════
// Algorithm trace — detailed step-by-step solver data for visualization
// ═══════════════════════════════════════════════════════════════

export interface LineSolveTraceStep {
  lineType: 'row' | 'col';
  lineIndex: number;
  length: number;
  clues: number[];
  /** Up to 10 sample placements (for display) */
  placements: boolean[][];
  /** Total valid placements */
  totalPlacements: number;
  /** Newly determined cell indices (in the line) */
  determinedIndices: number[];
  /** Value at each determined index: 'fill' or 'empty' */
  determinedValues: ('fill' | 'empty')[];
}

export interface SearchTreeNode {
  id: number;
  parentId: number | null;
  cell?: { row: number; col: number };
  guess?: 'fill' | 'cross';
  depth: number;
  result: 'solved' | 'contradiction' | 'branch';
  /** Cells determined by line solving at this node */
  newCells: number;
}

export interface AlgorithmTraceData {
  lineSteps: LineSolveTraceStep[];
  searchTree: SearchTreeNode[];
  totalLineSolveIterations: number;
  branchCount: number;
  solutionNodeIds: number[];
}

// ═══════════════════════════════════════════════════════════════
// Placement cache — keyed by `${L}:${clues.join(',')}`
// ═══════════════════════════════════════════════════════════════

const placementCache = new Map<string, boolean[][]>();

function cacheKey(L: number, clues: number[]): string {
  return `${L}:${clues.join(',')}`;
}

/**
 * Enumerate all possible boolean arrays of length L that satisfy the given clues.
 * `true` = filled cell in that placement.
 */
export function generatePlacements(L: number, clues: number[]): boolean[][] {
  if (clues.length === 0) {
    // No clues — only valid placement is all empty
    return [new Array(L).fill(false)];
  }

  const key = cacheKey(L, clues);
  const cached = placementCache.get(key);
  if (cached) return cached;

  const results: boolean[][] = [];
  const sumClues = clues.reduce((a, b) => a + b, 0);
  const minGaps = clues.length - 1;
  const slack = L - sumClues - minGaps;

  if (slack < 0) {
    placementCache.set(key, results); // cache empty — impossible line
    return results;
  }

  function backtrack(blockIdx: number, startPos: number, current: boolean[]) {
    if (blockIdx === clues.length) {
      // Pad remaining cells as empty
      while (current.length < L) current.push(false);
      results.push(current);
      return;
    }

    const blockSize = clues[blockIdx]!;
    const remainingBlocks = clues.length - blockIdx - 1;
    const remainingMin = remainingBlocks > 0
      ? clues.slice(blockIdx + 1).reduce((a, b) => a + b, 0) + remainingBlocks
      : 0;
    const maxStart = L - blockSize - remainingMin;

    for (let pos = startPos; pos <= maxStart; pos++) {
      const placement = [...current];
      // Pad to start position with false
      while (placement.length < pos) placement.push(false);
      // Fill the block
      for (let i = 0; i < blockSize; i++) placement.push(true);
      // Gap after block (unless it's the last one)
      if (blockIdx < clues.length - 1) placement.push(false);

      backtrack(blockIdx + 1, placement.length, placement);
    }
  }

  backtrack(0, 0, []);
  placementCache.set(key, results);
  return results;
}

/**
 * Check if a placement is compatible with the current line state.
 */
function isCompatible(placement: boolean[], line: CellState[]): boolean {
  for (let i = 0; i < placement.length; i++) {
    if (line[i] === FILLED && !placement[i]) return false;
    if (line[i] === CROSS && placement[i]) return false;
  }
  return true;
}

/**
 * Solve a single line (row or column) using the enumeration method.
 *
 * Returns:
 *  - { cells, changed } if successful: cells is the merged result, changed is whether any cell was updated
 *  - null if impossible (contradiction — no valid placement exists)
 */
function solveLine(line: CellState[], clues: number[]): { cells: CellState[]; changed: boolean } | null {
  const placements = generatePlacements(line.length, clues);
  if (placements.length === 0) return null;

  // Filter to compatible placements
  const valid = placements.filter(p => isCompatible(p, line));
  if (valid.length === 0) return null;

  // Merge: AND of all valid placements
  const merged = new Array<CellState>(line.length).fill(EMPTY);
  let changed = false;

  for (let i = 0; i < line.length; i++) {
    if (line[i] !== EMPTY) {
      // Already known — keep it
      merged[i] = line[i]!;
      continue;
    }

    const allFilled = valid.every(p => p[i] === true);
    const allEmpty = valid.every(p => p[i] === false);

    if (allFilled) {
      merged[i] = FILLED;
      changed = true;
    } else if (allEmpty) {
      merged[i] = CROSS;
      changed = true;
    } else {
      merged[i] = EMPTY;
    }
  }

  return { cells: merged, changed };
}

// ═══════════════════════════════════════════════════════════════
// Internal solver state (flat array for efficient cloning)
// ═══════════════════════════════════════════════════════════════

interface SolverInternal {
  width: number;
  height: number;
  /** Flat grid: grid[i*width + j] */
  cells: CellState[];
  rowClues: number[][];
  colClues: number[][];
}

function toInternal(state: NonogramState): SolverInternal {
  const { width, height } = state;
  const cells: CellState[] = new Array(width * height);
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      cells[r * width + c] = state.grid[r]![c]!;
    }
  }
  return {
    width,
    height,
    cells,
    rowClues: state.rowClues,
    colClues: state.colClues,
  };
}

function cloneInternal(s: SolverInternal): SolverInternal {
  return {
    width: s.width,
    height: s.height,
    cells: [...s.cells],
    rowClues: s.rowClues,
    colClues: s.colClues,
  };
}

function getRow(s: SolverInternal, r: number): CellState[] {
  const start = r * s.width;
  return s.cells.slice(start, start + s.width);
}

function setRow(s: SolverInternal, r: number, row: CellState[]): boolean {
  let changed = false;
  const start = r * s.width;
  for (let c = 0; c < s.width; c++) {
    const idx = start + c;
    if (s.cells[idx] !== row[c]) {
      s.cells[idx] = row[c]!;
      changed = true;
    }
  }
  return changed;
}

function getCol(s: SolverInternal, c: number): CellState[] {
  const col: CellState[] = new Array(s.height);
  for (let r = 0; r < s.height; r++) {
    col[r] = s.cells[r * s.width + c]!;
  }
  return col;
}

function setCol(s: SolverInternal, c: number, col: CellState[]): boolean {
  let changed = false;
  for (let r = 0; r < s.height; r++) {
    const idx = r * s.width + c;
    if (s.cells[idx] !== col[r]) {
      s.cells[idx] = col[r]!;
      changed = true;
    }
  }
  return changed;
}

function isAllDetermined(s: SolverInternal): boolean {
  return s.cells.every(cell => cell !== EMPTY);
}

// ═══════════════════════════════════════════════════════════════
// Line solver — iterative propagation
// ═══════════════════════════════════════════════════════════════

interface LineSolveResult {
  /** The solved internal state */
  state: SolverInternal;
  /** Whether all cells are determined (no backtracking needed) */
  solved: boolean;
  /** Number of cells determined by line solving */
  determined: number;
  /** Trace steps for visualization */
  traceSteps: LineSolveTraceStep[];
}

/**
 * Run the line solver iteratively until convergence.
 * Uses a queue of lines (rows and columns) that need to be re-processed.
 */
function lineSolve(state: SolverInternal): LineSolveResult {
  const queue: Array<{ type: 'row' | 'col'; index: number }> = [];
  const traceSteps: LineSolveTraceStep[] = [];

  // Initial queue: all rows and columns
  for (let r = 0; r < state.height; r++) queue.push({ type: 'row', index: r });
  for (let c = 0; c < state.width; c++) queue.push({ type: 'col', index: c });

  while (queue.length > 0) {
    const item = queue.shift()!;

    if (item.type === 'row') {
      const row = getRow(state, item.index);
      const clues = state.rowClues[item.index]!;
      const result = solveLine(row, clues);
      if (result === null) {
        return { state, solved: false, determined: countDetermined(state), traceSteps };
      }
      if (result.changed) {
        // Record trace: which cells were determined and how
        const determinedIndices: number[] = [];
        const determinedValues: ('fill' | 'empty')[] = [];
        for (let i = 0; i < row.length; i++) {
          if (row[i] === EMPTY && result.cells[i] !== EMPTY) {
            determinedIndices.push(i);
            determinedValues.push(result.cells[i] === FILLED ? 'fill' : 'empty');
          }
        }
        if (determinedIndices.length > 0 && traceSteps.length < 50) {
          const placements = generatePlacements(state.width, clues);
          traceSteps.push({
            lineType: 'row',
            lineIndex: item.index,
            length: state.width,
            clues: [...clues],
            placements: placements.slice(0, 10),
            totalPlacements: placements.length,
            determinedIndices,
            determinedValues,
          });
        }
        setRow(state, item.index, result.cells);
        for (let c = 0; c < state.width; c++) queue.push({ type: 'col', index: c });
      }
    } else {
      const col = getCol(state, item.index);
      const clues = state.colClues[item.index]!;
      const result = solveLine(col, clues);
      if (result === null) {
        return { state, solved: false, determined: countDetermined(state), traceSteps };
      }
      if (result.changed) {
        const determinedIndices: number[] = [];
        const determinedValues: ('fill' | 'empty')[] = [];
        for (let i = 0; i < col.length; i++) {
          if (col[i] === EMPTY && result.cells[i] !== EMPTY) {
            determinedIndices.push(i);
            determinedValues.push(result.cells[i] === FILLED ? 'fill' : 'empty');
          }
        }
        if (determinedIndices.length > 0 && traceSteps.length < 50) {
          const placements = generatePlacements(state.height, clues);
          traceSteps.push({
            lineType: 'col',
            lineIndex: item.index,
            length: state.height,
            clues: [...clues],
            placements: placements.slice(0, 10),
            totalPlacements: placements.length,
            determinedIndices,
            determinedValues,
          });
        }
        setCol(state, item.index, result.cells);
        for (let r = 0; r < state.height; r++) queue.push({ type: 'row', index: r });
      }
    }
  }

  return {
    state,
    solved: isAllDetermined(state),
    determined: countDetermined(state),
    traceSteps,
  };
}

function countDetermined(s: SolverInternal): number {
  let count = 0;
  for (const cell of s.cells) {
    if (cell !== EMPTY) count++;
  }
  return count;
}

// ═══════════════════════════════════════════════════════════════
// Backtracking solver
// ═══════════════════════════════════════════════════════════════

interface BacktrackStats {
  nodesExplored: number;
  backtracks: number;
  maxDepth: number;
  /** Grid snapshots at key moments, as flat CellState arrays */
  snapshots: { label: string; cells: CellState[] }[];
  /** Search tree nodes for visualization */
  searchTree: SearchTreeNode[];
  nextNodeId: number;
}

/**
 * Pick the most constrained undetermined cell.
 * "Most constrained" = cell that appears in the fewest valid row/column placements.
 *
 * For simplicity and speed, we pick the cell in the most-constrained row (row with
 * most determined cells). This is a heuristic — true MRV would compute placements
 * per cell, which is expensive.
 */
function pickCell(s: SolverInternal): { row: number; col: number } | null {
  let bestScore = -1;
  let bestCell: { row: number; col: number } | null = null;

  for (let r = 0; r < s.height; r++) {
    const row = getRow(s, r);
    for (let c = 0; c < s.width; c++) {
      if (row[c] !== EMPTY) continue;
      // Score: count determined cells in this row + this column
      let score = 0;
      for (let j = 0; j < s.width; j++) {
        if (j !== c && row[j] !== EMPTY) score++;
      }
      const col = getCol(s, c);
      for (let i = 0; i < s.height; i++) {
        if (i !== r && col[i] !== EMPTY) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCell = { row: r, col: c };
      }
    }
  }

  return bestCell;
}

interface SolveResult {
  solved: boolean;
  state?: SolverInternal;
  lineSolveCells: number;
  maxBacktrackDepth: number;
  nodesExplored: number;
  backtracks: number;
}

function backtrackSolve(
  s: SolverInternal,
  limit: number,
  depth: number,
  stats: BacktrackStats,
  solutions: SolverInternal[],
  parentId: number | null = null,
  guessCell?: { row: number; col: number },
  guessValue?: 'fill' | 'cross',
): { result: 'solved' | 'contradiction' } {
  // Early exit if we've reached the limit
  if (solutions.length >= limit) return { result: 'contradiction' };

  const nodeId = stats.nextNodeId++;
  stats.nodesExplored++;
  if (depth > stats.maxDepth) stats.maxDepth = depth;

  // Phase 1: Line solving
  const beforeLineSolve = s.cells.filter(c => c !== EMPTY).length;
  const lsResult = lineSolve(cloneInternal(s));
  Object.assign(s.cells, lsResult.state.cells);
  const afterLineSolve = s.cells.filter(c => c !== EMPTY).length;
  const newCells = afterLineSolve - beforeLineSolve;

  // Record search tree node (cap at 200)
  if (stats.searchTree.length < 200) {
    const node: SearchTreeNode = {
      id: nodeId,
      parentId,
      cell: guessCell,
      guess: guessValue,
      depth,
      result: isAllDetermined(s) && verifySolution(s) ? 'solved' : 'branch',
      newCells,
    };
    stats.searchTree.push(node);
  }

  // Check contradiction
  if (!verifyLineConsistency(s)) {
    // Update node result
    const node = stats.searchTree.find(n => n.id === nodeId);
    if (node) node.result = 'contradiction';
    return { result: 'contradiction' };
  }

  // Check if solved
  if (isAllDetermined(s)) {
    if (verifySolution(s)) {
      solutions.push(cloneInternal(s));
      // Update node result
      const node = stats.searchTree.find(n => n.id === nodeId);
      if (node) node.result = 'solved';
      return { result: 'solved' };
    }
    return { result: 'contradiction' };
  }

  // Phase 2: Pick a cell to branch on
  const cell = pickCell(s);
  if (!cell) return { result: 'contradiction' };

  stats.backtracks++;

  // Branch 1: Fill
  const s1 = cloneInternal(s);
  s1.cells[cell.row * s.width + cell.col] = FILLED;
  const r1 = backtrackSolve(s1, limit, depth + 1, stats, solutions, nodeId, cell, 'fill');
  if (solutions.length >= limit) return r1;

  // Branch 2: Cross
  const s2 = cloneInternal(s);
  s2.cells[cell.row * s.width + cell.col] = CROSS;
  return backtrackSolve(s2, limit, depth + 1, stats, solutions, nodeId, cell, 'cross');
}

/**
 * Verify that a fully-determined grid satisfies all clues.
 */
function verifySolution(s: SolverInternal): boolean {
  // Check rows
  for (let r = 0; r < s.height; r++) {
    const expected = s.rowClues[r]!;
    const actual: number[] = [];
    let run = 0;
    for (let c = 0; c < s.width; c++) {
      if (s.cells[r * s.width + c] === FILLED) {
        run++;
      } else {
        if (run > 0) { actual.push(run); run = 0; }
      }
    }
    if (run > 0) actual.push(run);
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }
  }
  // Check columns
  for (let c = 0; c < s.width; c++) {
    const expected = s.colClues[c]!;
    const actual: number[] = [];
    let run = 0;
    for (let r = 0; r < s.height; r++) {
      if (s.cells[r * s.width + c] === FILLED) {
        run++;
      } else {
        if (run > 0) { actual.push(run); run = 0; }
      }
    }
    if (run > 0) actual.push(run);
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export interface NonogramSolveResult {
  solvable: boolean;
  /** The solution state (filled cells pattern), if solvable */
  solution?: boolean[][];
  stats: {
    nodesExplored: number;
    backtracks: number;
    maxDepth: number;
    timeMs: number;
    /** Cells determined by line solving alone (before any backtracking) */
    lineSolveCells: number;
    solverName: string;
  };
  trace: SolverTrace;
}

/**
 * Solve a Nonogram puzzle. Returns the solution with stats and trace.
 */
export function solveNonogram(state: NonogramState): NonogramSolveResult {
  const t0 = performance.now();

  const internal = toInternal(state);
  const stats: BacktrackStats = { nodesExplored: 0, backtracks: 0, maxDepth: 0, snapshots: [], searchTree: [], nextNodeId: 0 };
  const solutions: SolverInternal[] = [];

  // Initial line solve
  const initial = lineSolve(cloneInternal(internal));

  if (initial.solved && verifySolution(initial.state)) {
    solutions.push(initial.state);
    // Record root node
    stats.searchTree.push({
      id: 0, parentId: null, depth: 0,
      result: 'solved',
      newCells: initial.determined,
    });
  } else {
    backtrackSolve(internal, 1, 0, stats, solutions);
  }

  const elapsed = Math.round(performance.now() - t0);

  const solvable = solutions.length > 0;
  const solution = solvable
    ? internalToGrid(solutions[0]!, state.height, state.width)
    : undefined;

  // Build algorithm trace
  const algorithmTrace: AlgorithmTraceData = {
    lineSteps: initial.traceSteps,
    searchTree: stats.searchTree,
    totalLineSolveIterations: initial.traceSteps.length,
    branchCount: stats.backtracks,
    solutionNodeIds: stats.searchTree.filter(n => n.result === 'solved').map(n => n.id),
  };

  return {
    solvable,
    solution,
    stats: {
      nodesExplored: stats.nodesExplored,
      backtracks: stats.backtracks,
      maxDepth: stats.maxDepth,
      timeMs: elapsed,
      lineSolveCells: initial.determined,
      solverName: 'Nonogram — Line Solver + Backtracking',
    },
    trace: {
      type: 'constraint-propagation',
      steps: [],
      visualizationData: {
        nodesExplored: stats.nodesExplored,
        backtracks: stats.backtracks,
        maxDepth: stats.maxDepth,
        lineSolveCells: initial.determined,
        timeMs: elapsed,
        width: state.width,
        height: state.height,
        algorithmTrace,
      },
    },
  };
}

/**
 * Count the number of solutions for a Nonogram puzzle, up to a given limit.
 * Used for uniqueness verification: countSolutions(state, 2) === 1 means unique.
 */
export function countSolutions(state: NonogramState, limit: number = 2): number {
  const internal = toInternal(state);
  const stats: BacktrackStats = { nodesExplored: 0, backtracks: 0, maxDepth: 0, snapshots: [], searchTree: [], nextNodeId: 0 };
  const solutions: SolverInternal[] = [];

  // Initial line solve
  const initial = lineSolve(cloneInternal(internal));
  if (!verifyLineConsistency(initial.state)) return 0;

  if (initial.solved && verifySolution(initial.state)) {
    solutions.push(initial.state);
    return solutions.length; // Already fully solved — no need to backtrack
  }

  // Use the line-solved state (this prunes the search space significantly)
  backtrackSolve(initial.state, limit, 0, stats, solutions);

  return solutions.length;
}

/**
 * Quick check that the line-solved state hasn't produced an obvious contradiction.
 */
function verifyLineConsistency(s: SolverInternal): boolean {
  // Check that no row or column is trivially contradictory
  for (let r = 0; r < s.height; r++) {
    const row = getRow(s, r);
    const placements = generatePlacements(s.width, s.rowClues[r]!);
    if (!placements.some(p => isCompatible(p, row))) return false;
  }
  for (let c = 0; c < s.width; c++) {
    const col = getCol(s, c);
    const placements = generatePlacements(s.height, s.colClues[c]!);
    if (!placements.some(p => isCompatible(p, col))) return false;
  }
  return true;
}

function internalToGrid(s: SolverInternal, height: number, width: number): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < height; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < width; c++) {
      row.push(s.cells[r * width + c] === FILLED);
    }
    grid.push(row);
  }
  return grid;
}
