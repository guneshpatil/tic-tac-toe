import type { Player } from "./types";

export const LINES: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function calculateWinner(
  board: ReadonlyArray<Player>
): { winner: Player; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [...line] };
    }
  }
  return null;
}

export function isDraw(board: ReadonlyArray<Player>): boolean {
  return board.every(Boolean) && !calculateWinner(board);
}
