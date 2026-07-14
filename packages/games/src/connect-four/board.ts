import { COLS, ROWS, WIN_LENGTH, type Cell } from './types';

export function createEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as Cell));
}

export function discForPlayer(player: 0 | 1): Cell {
  return (player + 1) as Cell;
}

export function isColumnFull(board: Cell[][], column: number): boolean {
  if (column < 0 || column >= COLS) return true;
  return board[0]![column] !== 0;
}

export function dropDisc(board: Cell[][], column: number, player: 0 | 1): { board: Cell[][]; row: number } | null {
  if (isColumnFull(board, column)) return null;

  const next = board.map(row => [...row]);
  const disc = discForPlayer(player);

  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (next[row]![column] === 0) {
      next[row]![column] = disc;
      return { board: next, row };
    }
  }

  return null;
}

function countLine(board: Cell[][], row: number, col: number, dr: number, dc: number, disc: Cell): number {
  let count = 0;
  let r = row;
  let c = col;

  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r]![c] === disc) {
    count += 1;
    r += dr;
    c += dc;
  }

  return count;
}

export function checkWinnerFrom(board: Cell[][], row: number, col: number): 0 | 1 | null {
  const disc = board[row]![col];
  if (disc !== 1 && disc !== 2) return null;

  const player = (disc - 1) as 0 | 1;
  const directions: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    const total =
      countLine(board, row, col, dr, dc, disc) +
      countLine(board, row, col, -dr, -dc, disc) -
      1;
    if (total >= WIN_LENGTH) return player;
  }

  return null;
}

export function detectExistingWinner(board: Cell[][]): 0 | 1 | 'draw' | null {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const disc = board[row]![col];
      if (disc === 0) continue;
      const win = checkWinnerFrom(board, row, col);
      if (win !== null) return win;
    }
  }
  if (isBoardFull(board)) return 'draw';
  return null;
}

export function getDropRow(board: Cell[][], column: number): number | null {
  if (isColumnFull(board, column)) return null;
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row]![column] === 0) return row;
  }
  return null;
}

export function isBoardFull(board: Cell[][]): boolean {
  return board[0]!.every(cell => cell !== 0);
}

export function resolveWinner(board: Cell[][], lastRow: number, lastCol: number): 0 | 1 | 'draw' | null {
  const win = checkWinnerFrom(board, lastRow, lastCol);
  if (win !== null) return win;
  if (isBoardFull(board)) return 'draw';
  return null;
}

export function countPieces(board: Cell[][]): number {
  let count = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row]![col] !== 0) count += 1;
    }
  }
  return count;
}
