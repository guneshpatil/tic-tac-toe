import type { AiLevel, Board, CellIndex, GameConfig, Player, Status } from "./types";

export const STORAGE_KEYS = {
  score: "ttt:score:v1",
  mode: "ttt:mode:v1",
  set: "ttt:set:v1",
  size: "ttt:size:v1",
  ai: "ttt:ai:v1",
} as const;

export function emptyBoard(size: number): Board {
  return Array(size * size).fill(null);
}

export function getLines(config: GameConfig): number[][] {
  const { size, winLength } = config;
  const lines: number[][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const line: number[] = [];
      for (let k = 0; k < winLength; k++) line.push(r * size + c + k);
      lines.push(line);
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      const line: number[] = [];
      for (let k = 0; k < winLength; k++) line.push((r + k) * size + c);
      lines.push(line);
    }
  }
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const line: number[] = [];
      for (let k = 0; k < winLength; k++) line.push((r + k) * size + (c + k));
      lines.push(line);
    }
  }
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = winLength - 1; c < size; c++) {
      const line: number[] = [];
      for (let k = 0; k < winLength; k++) line.push((r + k) * size + (c - k));
      lines.push(line);
    }
  }
  return lines;
}

export function calculateWinner(
  board: Board,
  config: GameConfig
): { winner: Player; line: number[] } | null {
  for (const line of getLines(config)) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      let allSame = true;
      for (let k = 1; k < line.length; k++) {
        if (board[line[k]] !== board[a]) {
          allSame = false;
          break;
        }
      }
      if (allSame) return { winner: board[a] as Player, line: [...line] };
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return board.every(Boolean);
}

export function getStatus(board: Board, turn: "X" | "O", config: GameConfig): Status {
  const w = calculateWinner(board, config);
  if (w) return { kind: "won", winner: w.winner as "X" | "O", line: w.line };
  if (isDraw(board)) return { kind: "draw" };
  return { kind: "playing", turn };
}

export function nextTurn(turn: "X" | "O"): "X" | "O" {
  return turn === "X" ? "O" : "X";
}

export function emptyScores(): Record<"X" | "O" | "draw", number> {
  return { X: 0, O: 0, draw: 0 };
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function aiMove(
  board: Board,
  config: GameConfig,
  level: AiLevel
): CellIndex | null {
  if (level === "off") return null;
  const empty = board
    .map((c, i) => (c ? -1 : i))
    .filter((i) => i >= 0);
  if (empty.length === 0) return null;

  if (level === "easy") {
    if (Math.random() < 0.6) return randomChoice(empty);
  }

  return bestMove(board, config, level);
}

function bestMove(board: Board, config: GameConfig, level: AiLevel): CellIndex {
  const maxDepth = level === "hard" ? (config.size <= 3 ? 9 : config.size <= 4 ? 4 : 3) : 2;
  let bestScore = -Infinity;
  let best: CellIndex = board.findIndex((c) => !c);
  const empties = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);

  for (const i of empties) {
    const next = board.slice();
    next[i] = "O";
    const score = minimax(next, 0, false, -Infinity, Infinity, maxDepth, config);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function evaluate(board: Board, config: GameConfig): number {
  const winner = calculateWinner(board, config);
  if (winner) return winner.winner === "O" ? 100000 : -100000;
  if (isDraw(board)) return 0;

  let score = 0;
  const lines = getLines(config);
  for (const line of lines) {
    const xs = line.filter((i) => board[i] === "X").length;
    const os = line.filter((i) => board[i] === "O").length;
    if (xs > 0 && os > 0) continue;
    if (os > 0) score += Math.pow(10, os);
    else if (xs > 0) score -= Math.pow(10, xs);
  }
  return score;
}

function minimax(
  board: Board,
  depth: number,
  isMax: boolean,
  alpha: number,
  beta: number,
  maxDepth: number,
  config: GameConfig
): number {
  const winner = calculateWinner(board, config);
  if (winner) {
    return (winner.winner === "O" ? 100000 : -100000) - depth;
  }
  if (isDraw(board)) return 0;
  if (depth >= maxDepth) return evaluate(board, config);

  const empties = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (isMax) {
    let best = -Infinity;
    for (const i of empties) {
      const next = board.slice();
      next[i] = "O";
      const v = minimax(next, depth + 1, false, alpha, beta, maxDepth, config);
      best = Math.max(best, v);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empties) {
      const next = board.slice();
      next[i] = "X";
      const v = minimax(next, depth + 1, true, alpha, beta, maxDepth, config);
      best = Math.min(best, v);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}
