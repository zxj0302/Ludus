import type { Solution, SolverTrace } from '@ludus/core';
import type { FifteenState, FifteenMove } from './types';
import { GOAL_GRID, SIZE } from './types';
import { findEmpty } from './rules';

export interface AStarNode {
  grid: number[];
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
  move: number | null; // tileIndex that was moved
}

export function manhattanDistance(grid: number[]): number {
  let dist = 0;
  for (let i = 0; i < 16; i++) {
    const val = grid[i]!;
    if (val === 0) continue;
    const targetRow = Math.floor((val - 1) / SIZE);
    const targetCol = (val - 1) % SIZE;
    const currentRow = Math.floor(i / SIZE);
    const currentCol = i % SIZE;
    dist += Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
  }
  return dist;
}

function getNeighborTiles(grid: number[]): number[] {
  const emptyIdx = findEmpty(grid);
  const row = Math.floor(emptyIdx / SIZE);
  const col = emptyIdx % SIZE;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(emptyIdx - SIZE);
  if (row < SIZE - 1) neighbors.push(emptyIdx + SIZE);
  if (col > 0) neighbors.push(emptyIdx - 1);
  if (col < SIZE - 1) neighbors.push(emptyIdx + 1);
  return neighbors;
}

// Min-heap for A* priority queue
class MinHeap {
  private heap: AStarNode[] = [];

  push(node: AStarNode): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): AStarNode | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number { return this.heap.length; }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent]!.f <= this.heap[idx]!.f) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx]!, this.heap[parent]!];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const len = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < len && this.heap[left]!.f < this.heap[smallest]!.f) smallest = left;
      if (right < len && this.heap[right]!.f < this.heap[smallest]!.f) smallest = right;
      if (smallest === idx) break;
      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest]!, this.heap[idx]!];
      idx = smallest;
    }
  }
}

export function solveFifteen(state: FifteenState): Solution {
  const startTime = performance.now();
  const startGrid = state.grid;

  const startH = manhattanDistance(startGrid);
  const startNode: AStarNode = { grid: startGrid, g: 0, h: startH, f: startH, parent: null, move: null };

  const openSet = new MinHeap();
  openSet.push(startNode);
  const closedSet = new Set<string>();

  let nodesExplored = 0;
  const goalKey = GOAL_GRID.join(',');

  while (openSet.size > 0) {
    const current = openSet.pop()!;

    const key = current.grid.join(',');
    if (key === goalKey) {
      nodesExplored++; // count goal node as explored
      // Reconstruct path
      const moves: FifteenMove[] = [];
      const pathNodes: { grid: number[]; g: number; h: number; f: number }[] = [];
      let node: AStarNode | null = current;
      while (node) {
        if (node.move !== null) {
          moves.unshift({ tileIndex: node.move });
        }
        pathNodes.unshift({ grid: [...node.grid], g: node.g, h: node.h, f: node.f });
        node = node.parent;
      }

      const timeMs = Math.round(performance.now() - startTime);
      return {
        solvable: true,
        moves,
        trace: {
          type: 'a-star-search' as SolverTrace['type'],
          steps: pathNodes.map((n, i) => ({
            description: `Step ${i}: g=${n.g}, h=${n.h}, f=${n.f}`,
            data: { grid: n.grid, g: n.g, h: n.h, f: n.f, step: i },
          })),
          visualizationData: {
            nodesExplored,
            solutionLength: moves.length,
            pathNodes,
            timeMs,
          },
        },
        stats: {
          nodesExplored,
          timeMs,
          solutionLength: moves.length,
          solverName: 'A* (Manhattan distance)',
          terminated: 'solved',
        },
      };
    }

    // Skip duplicate states (multiple paths to same grid) — count only unique expansions
    if (closedSet.has(key)) continue;
    closedSet.add(key);
    nodesExplored++;

    // Hoisted: findEmpty only once per node (was redundantly in neighbor loop)
    const emptyIdx = findEmpty(current.grid);
    const neighbors = getNeighborTiles(current.grid);
    for (const tileIdx of neighbors) {
      const newGrid = [...current.grid];
      newGrid[emptyIdx] = newGrid[tileIdx]!;
      newGrid[tileIdx] = 0;

      const newKey = newGrid.join(',');
      if (closedSet.has(newKey)) continue;

      const g = current.g + 1;
      const h = manhattanDistance(newGrid);
      openSet.push({ grid: newGrid, g, h, f: g + h, parent: current, move: tileIdx });
    }
  }

  const timeMs = Math.round(performance.now() - startTime);
  return {
    solvable: false,
    moves: [],
    stats: {
      nodesExplored,
      timeMs,
      solutionLength: 0,
      solverName: 'A* (Manhattan distance)',
      terminated: 'exhausted',
    },
  };
}
