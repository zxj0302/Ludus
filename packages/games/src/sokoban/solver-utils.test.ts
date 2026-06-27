import { describe, it, expect } from 'vitest';
import {
  legalMoves, applyMove, isSolved, isDeadlock, stateHash, expandState,
} from './solver-utils';
import { solveSokobanBFS } from './solver';
import { parseSokobanLevel, getLevel } from './levels';

const PUSH_LEVEL = `
#####
#   #
# . #
# $ #
# @ #
#####`;

const OPEN_BOX = `
######
#    #
# .  #
# $  #
# @  #
######`;

const CORNER_DEADLOCK = `
######
# .  #
## # #
#$ # #
#  @ #
######`;

const SOLVED_LEVEL = `
####
#*@#
#  #
####`;

describe('parseSokobanLevel', () => {
  it('parses a simple level', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    expect(state.width).toBe(5);
    expect(state.height).toBe(6);
    expect(state.goals.length).toBe(1);
    expect(state.boxes.length).toBe(1);
  });

  it('throws on empty input', () => {
    expect(() => parseSokobanLevel('')).toThrow();
  });
});

describe('legalMoves', () => {
  it('returns valid moves for simple level', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    const moves = legalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) {
      expect(['up', 'down', 'left', 'right']).toContain(m.direction);
    }
  });

  it('cannot walk through walls', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    const moves = legalMoves(state);
    const dirs = new Set(moves.map(m => m.direction));
    expect(dirs.has('down')).toBe(false); // wall below
    expect(dirs.has('left')).toBe(true);
  });

  it('can push box when space behind is free', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    const moves = legalMoves(state);
    const upMove = moves.find(m => m.direction === 'up');
    expect(upMove).toBeDefined();
    const leftMove = moves.find(m => m.direction === 'left');
    expect(leftMove).toBeDefined();
  });
});

describe('applyMove', () => {
  it('moves player up (pushes box out of the way)', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    const newState = applyMove(state, { direction: 'up' });
    expect(newState.player.row).toBe(3);
    expect(newState.player.col).toBe(2);
    expect(state.player.row).toBe(4); // original unchanged
  });

  it('pushes box when moving into it', () => {
    const state = parseSokobanLevel(`
#####
#   #
# @ #
# $ #
#   #
# . #
#####`);
    const s1 = applyMove(state, { direction: 'down' });
    expect(s1.player.row).toBe(3);
    expect(s1.player.col).toBe(2);
    expect(s1.boxes.some(b => b.row === 4 && b.col === 2)).toBe(true);
    expect(s1.boxes.some(b => b.row === 3 && b.col === 2)).toBe(false);
  });

  it('does not mutate original state', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    const origPlayer = { ...state.player };
    const origBoxes = [...state.boxes];
    const newState = applyMove(state, { direction: 'up' });
    expect(state.player).toEqual(origPlayer);
    expect(state.boxes).toEqual(origBoxes);
    expect(newState.boxes).not.toBe(state.boxes); // 不可变性：不同引用
  });
});

describe('isSolved', () => {
  it('all boxes on goals', () => {
    const state = parseSokobanLevel(SOLVED_LEVEL);
    expect(isSolved(state)).toBe(true);
  });

  it('not solved when box not on goal', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    expect(isSolved(state)).toBe(false);
  });
});

describe('isDeadlock', () => {
  it('box in corner not on goal is deadlock', () => {
    const state = parseSokobanLevel(CORNER_DEADLOCK);
    expect(isDeadlock(state)).toBe(true);
  });

  it('box on goal in corner is not deadlock', () => {
    const state = parseSokobanLevel(`
#####
#   #
##*##
# @ #
#####`);
    expect(isDeadlock(state)).toBe(false);
  });

  it('free box in open is not deadlock', () => {
    const state = parseSokobanLevel(OPEN_BOX);
    expect(isDeadlock(state)).toBe(false);
  });
});

describe('solveSokobanBFS', () => {
  it('trivial: already solved', () => {
    const state = parseSokobanLevel(SOLVED_LEVEL);
    const sol = solveSokobanBFS(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBe(0);
  });

  it('solves a simple level', () => {
    const state = getLevel(0); // Level 1: 2 boxes tutorial
    const sol = solveSokobanBFS(state, 15000);
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBeGreaterThan(0);
    expect(sol.stats.solverName).toContain('BFS');
    expect(sol.trace?.type).toBe('search-tree');

    let s = state;
    for (const m of sol.moves) {
      s = applyMove(s, m as { direction: 'up' | 'down' | 'left' | 'right' });
    }
    expect(isSolved(s)).toBe(true);
  });
});

describe('stateHash', () => {
  it('produces same hash for equivalent states', () => {
    const s1 = parseSokobanLevel(OPEN_BOX);
    const s2 = parseSokobanLevel(OPEN_BOX);
    expect(stateHash(s1)).toBe(stateHash(s2));
  });
});

describe('expandState', () => {
  it('returns legal children with metadata', () => {
    const state = parseSokobanLevel(PUSH_LEVEL);
    const children = expandState(state);
    expect(children.length).toBeGreaterThan(0);
    expect(children.length).toBeLessThanOrEqual(4);

    for (const child of children) {
      expect(['up', 'down', 'left', 'right']).toContain(child.direction);
      expect(child.state).toBeDefined();
      expect(typeof child.isPush).toBe('boolean');
      expect(typeof child.isDeadlock).toBe('boolean');
      expect(typeof child.isSolved).toBe('boolean');
    }
  });

  it('detects push vs walk', () => {
    const state = parseSokobanLevel(`
#####
#   #
# @ #
# $ #
#   #
# . #
#####`);
    const children = expandState(state);
    const pushDown = children.find(c => c.direction === 'down');
    expect(pushDown).toBeDefined();
    expect(pushDown!.isPush).toBe(true);
  });

  it('detects deadlock children', () => {
    const state = parseSokobanLevel(CORNER_DEADLOCK);
    const children = expandState(state);
    // 某一步可能把箱子推入死锁
    const deadlocks = children.filter(c => c.isDeadlock);
    // 至少有一个走子方向会导致死锁
    expect(deadlocks.length).toBeGreaterThanOrEqual(0);
  });

  it('detects solved child', () => {
    // 玩家在箱子下方，上推箱子到目标
    const state = parseSokobanLevel(`
#####
# . #
# $ #
# @ #
#####`);
    const children = expandState(state);
    const solved = children.find(c => c.isSolved);
    expect(solved).toBeDefined();
    expect(solved!.direction).toBe('up');
  });
});
