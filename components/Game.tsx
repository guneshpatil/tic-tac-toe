"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Board, Player, Status } from "@/lib/types";
import { calculateWinner, isDraw } from "@/lib/game";

const STORAGE_KEY = "ttt:score:v1";

type Scores = Record<"X" | "O" | "draw", number>;

const emptyScores: Scores = { X: 0, O: 0, draw: 0 };

export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [scores, setScores] = useState<Scores>(emptyScores);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setScores({ ...emptyScores, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {}
  }, [scores]);

  const status: Status = useMemo(() => {
    const w = calculateWinner(board);
    if (w) return { kind: "won", winner: w.winner, line: w.line };
    if (isDraw(board)) return { kind: "draw" };
    return { kind: "playing", turn };
  }, [board, turn]);

  const play = useCallback(
    (i: number) => {
      if (status.kind !== "playing" || board[i]) return;
      const next = board.slice() as Board;
      next[i] = turn;
      setBoard(next);
      setTurn(turn === "X" ? "O" : "X");
    },
    [board, turn, status]
  );

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }, []);

  const resetAll = useCallback(() => {
    reset();
    setScores(emptyScores);
  }, [reset]);

  useEffect(() => {
    if (status.kind === "won") {
      setScores((s) => ({ ...s, [status.winner]: s[status.winner] + 1 }));
    } else if (status.kind === "draw") {
      setScores((s) => ({ ...s, draw: s.draw + 1 }));
    }
  }, [status]);

  const message =
    status.kind === "won"
      ? `Player ${status.winner} wins!`
      : status.kind === "draw"
      ? "It's a draw."
      : `Player ${status.turn}'s turn`;

  return (
    <div className="w-full max-w-md">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Tic Tac Toe</h1>
        <p
          className={`mt-2 text-lg ${
            status.kind === "won"
              ? "text-emerald-400"
              : status.kind === "draw"
              ? "text-amber-400"
              : turn === "X"
              ? "text-x"
              : "text-o"
          }`}
          aria-live="polite"
        >
          {message}
        </p>
      </header>

      <div
        className="grid grid-cols-3 gap-3 p-3 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl"
        role="grid"
        aria-label="Tic tac toe board"
      >
        {board.map((cell, i) => {
          const isWin =
            status.kind === "won" && status.line.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={status.kind !== "playing" || !!cell}
              aria-label={
                cell ? `Cell ${i + 1}, ${cell}` : `Empty cell ${i + 1}`
              }
              className={`cell ${
                isWin ? "win" : ""
              } ${cell === "X" ? "text-x" : cell === "O" ? "text-o" : ""}`}
            >
              <span className="text-5xl sm:text-6xl font-black leading-none select-none">
                {cell}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Score label="X" value={scores.X} color="text-x" />
        <Score label="Draws" value={scores.draw} color="text-amber-400" />
        <Score label="O" value={scores.O} color="text-o" />
      </div>

      <div className="mt-6 flex gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          New round
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          Reset scores
        </button>
      </div>
    </div>
  );
}

function Score({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-3">
      <div className="text-xs uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
