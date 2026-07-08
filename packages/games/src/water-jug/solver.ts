import type { Solution, SolverTrace } from '@ludus/core';
import type { WaterJugState, WaterJugMove } from './types';
import { legalMoves, applyMove, isSolved } from './rules';

interface BFSNode {
  state: WaterJugState;
  parent: BFSNode | null;
  move: WaterJugMove | null;
  depth: number;
}

/** Encode a state as a string key for dedup */
function stateKey(state: WaterJugState): string {
  return state.jugs.join(',');
}

export function solveWaterJug(state: WaterJugState): Solution {
  const t0 = performance.now();

  // Early check: is it already solved?
  if (isSolved(state)) {
    return {
      solvable: true,
      moves: [],
      stats: {
        nodesExplored: 0,
        timeMs: 0,
        solutionLength: 0,
        solverName: 'BFS (Water Jug) — already solved',
      },
      trace: {
        type: 'bfs-state-search',
        steps: [],
        visualizationData: {
          nodesExplored: 0,
          solutionLength: 0,
          pathStates: [state],
          timeMs: 0,
        },
      },
    };
  }

  const visited = new Set<string>();
  const queue: BFSNode[] = [];

  const root: BFSNode = { state, parent: null, move: null, depth: 0 };
  visited.add(stateKey(state));
  queue.push(root);

  let solutionNode: BFSNode | null = null;
  let nodesExplored = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodesExplored++;

    const moves = legalMoves(current.state);
    for (const move of moves) {
      const nextState = applyMove(current.state, move);
      const key = stateKey(nextState);

      if (visited.has(key)) continue;
      visited.add(key);

      const child: BFSNode = {
        state: nextState,
        parent: current,
        move,
        depth: current.depth + 1,
      };

      if (isSolved(nextState)) {
        solutionNode = child;
        // Break out of both loops
        queue.length = 0;
        break;
      }

      queue.push(child);
    }
  }

  const elapsed = Math.round(performance.now() - t0);

  if (!solutionNode) {
    return {
      solvable: false,
      moves: [],
      stats: {
        nodesExplored,
        timeMs: elapsed,
        solutionLength: 0,
        solverName: 'BFS (Water Jug) — unsolvable',
      },
      trace: {
        type: 'bfs-state-search',
        steps: [],
        visualizationData: {
          nodesExplored,
          solutionLength: 0,
          pathStates: [],
          timeMs: elapsed,
        },
      },
    };
  }

  // Reconstruct solution path
  const solutionMoves: WaterJugMove[] = [];
  const pathStates: WaterJugState[] = [];
  let node: BFSNode | null = solutionNode;

  while (node) {
    pathStates.unshift(node.state);
    if (node.move) solutionMoves.unshift(node.move);
    node = node.parent;
  }

  const solveSteps = solutionMoves.map((move, i) => ({
    description: formatWaterJugMove(move),
    move,
    stateAfter: pathStates[i + 1]!,
  }));

  return {
    solvable: true,
    moves: solutionMoves,
    stats: {
      nodesExplored,
      timeMs: elapsed,
      solutionLength: solutionMoves.length,
      solverName: 'BFS (Water Jug)',
    },
    trace: {
      type: 'bfs-state-search',
      steps: solveSteps.map(s => ({
        description: s.description,
        data: { move: s.move, stateAfter: s.stateAfter },
      })),
      visualizationData: {
        nodesExplored,
        solutionLength: solutionMoves.length,
        pathStates,
        timeMs: elapsed,
      },
    },
  };
}

export function formatWaterJugMove(move: WaterJugMove): string {
  if (move.type === 'fill') {
    return `Fill jug ${move.jugIndex + 1}`;
  } else if (move.type === 'empty') {
    return `Empty jug ${move.jugIndex + 1}`;
  } else {
    return `Pour jug ${move.from + 1} → jug ${move.to + 1}`;
  }
}
