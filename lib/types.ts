export type Player = "X" | "O" | null;
export type Board = Player[];
export type Status =
  | { kind: "playing"; turn: "X" | "O" }
  | { kind: "won"; winner: "X" | "O"; line: number[] }
  | { kind: "draw" };
