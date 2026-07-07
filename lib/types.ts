export type Player = "X" | "O" | null;
export type Board = Player[];
export type CellIndex = number;

export type AiLevel = "off" | "easy" | "hard";

export type Status =
  | { kind: "playing"; turn: "X" | "O" }
  | { kind: "won"; winner: "X" | "O"; line: number[] }
  | { kind: "draw" };

export type GameConfig = {
  size: number;
  winLength: number;
  ai: AiLevel;
  aiPlayer: "X" | "O";
};
