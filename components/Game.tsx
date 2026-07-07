"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Board, Status } from "@/lib/types";
import { calculateWinner, isDraw } from "@/lib/game";

const STORAGE_KEY = "ttt:score:v1";
const MODE_KEY = "ttt:mode:v1";
const SET_KEY = "ttt:set:v1";

type Scores = Record<"X" | "O" | "draw", number>;
type Mode = "adult" | "kids";
type PlayerSet = {
  id: "classic" | "girl-boy" | "animals";
  label: string;
  X: string;
  O: string;
  xColor: string;
  oColor: string;
};

const PLAYER_SETS: PlayerSet[] = [
  { id: "classic",  label: "Classic",        X: "X",  O: "O",  xColor: "text-x",          oColor: "text-o"          },
  { id: "girl-boy", label: "Girl 🦄 vs Boy", X: "🦄", O: "🚀", xColor: "text-pink-500",   oColor: "text-sky-500"    },
  { id: "animals",  label: "Animals",        X: "🐱", O: "🐶", xColor: "text-amber-500",  oColor: "text-emerald-500"},
];

const emptyScores: Scores = { X: 0, O: 0, draw: 0 };

export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [scores, setScores] = useState<Scores>(emptyScores);
  const [mode, setMode] = useState<Mode>("adult");
  const [setId, setSetId] = useState<PlayerSet["id"]>("classic");
  const [hydrated, setHydrated] = useState(false);

  const isKids = mode === "kids";

  const set = useMemo(
    () =>
      isKids
        ? PLAYER_SETS.find((s) => s.id === setId) ?? PLAYER_SETS[0]
        : PLAYER_SETS[0],
    [setId, isKids]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!isKids && setId !== "classic") setSetId("classic");
  }, [isKids, hydrated, setId]);

  useEffect(() => {
    try {
      const rawScores = localStorage.getItem(STORAGE_KEY);
      if (rawScores) setScores({ ...emptyScores, ...JSON.parse(rawScores) });
      const rawMode = localStorage.getItem(MODE_KEY) as Mode | null;
      if (rawMode === "adult" || rawMode === "kids") setMode(rawMode);
      const rawSet = localStorage.getItem(SET_KEY) as PlayerSet["id"] | null;
      if (rawSet && PLAYER_SETS.some((s) => s.id === rawSet)) setSetId(rawSet);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {}
  }, [scores, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {}
  }, [mode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isKids) localStorage.setItem(SET_KEY, setId);
      else localStorage.removeItem(SET_KEY);
    } catch {}
  }, [setId, isKids, hydrated]);

  const status: Status = useMemo(() => {
    const w = calculateWinner(board);
    if (w) return { kind: "won", winner: w.winner as "X" | "O", line: w.line };
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

  const symbol = (p: "X" | "O") => (p === "X" ? set.X : set.O);
  const turnColor = turn === "X" ? set.xColor : set.oColor;

  const message =
    status.kind === "won"
      ? isKids
        ? `🎉 ${symbol(status.winner)} wins! Great job!`
        : `Player ${symbol(status.winner)} wins!`
      : status.kind === "draw"
      ? isKids
        ? "🤝 It's a tie! Try again!"
        : "It's a draw."
      : isKids
      ? `👉 ${symbol(turn)}'s turn!`
      : `Player ${symbol(turn)}'s turn`;

  return (
    <div
      className={`w-full max-w-md transition-colors duration-300 ${
        isKids
          ? "bg-gradient-to-b from-sky-400 to-emerald-300 p-6 rounded-3xl shadow-2xl"
          : ""
      }`}
    >
      <header className="mb-6 text-center">
        <h1
          className={`font-bold tracking-tight ${
            isKids ? "text-5xl text-white drop-shadow-md" : "text-4xl text-slate-100"
          }`}
        >
          {isKids ? "🎮 Tic Tac Toe" : "Tic Tac Toe"}
        </h1>

        <div
          role="tablist"
          aria-label="Game mode"
          className={`mt-4 inline-flex rounded-full p-1 ${
            isKids ? "bg-white/30 backdrop-blur" : "bg-slate-800 border border-slate-700"
          }`}
        >
          <ModeButton
            active={!isKids}
            onClick={() => setMode("adult")}
            label="Adult"
            kids={isKids}
          />
          <ModeButton
            active={isKids}
            onClick={() => setMode("kids")}
            label="Kids"
            kids={isKids}
          />
        </div>

        {isKids && (
          <div className="mt-4 flex justify-center flex-wrap gap-2">
            {PLAYER_SETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSetId(s.id)}
                aria-pressed={setId === s.id}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                  setId === s.id
                    ? "bg-white text-sky-700 shadow"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <span aria-hidden>{s.X}</span>
                <span className="opacity-60">vs</span>
                <span aria-hidden>{s.O}</span>
                {setId !== s.id && (
                  <span className="hidden sm:inline ml-1 opacity-70">{s.label}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <p
          className={`mt-4 ${
            isKids ? "text-2xl font-bold text-white drop-shadow" : "text-lg"
          } ${
            !isKids &&
            (status.kind === "won"
              ? "text-emerald-400"
              : status.kind === "draw"
              ? "text-amber-400"
              : turnColor)
          }`}
          aria-live="polite"
        >
          {message}
        </p>
      </header>

      <div
        className={`grid grid-cols-3 gap-3 p-3 rounded-3xl shadow-xl ${
          isKids
            ? "bg-white/40 backdrop-blur-sm gap-4 p-4"
            : "bg-slate-900/60 border border-slate-800"
        }`}
        role="grid"
        aria-label="Tic tac toe board"
      >
        {board.map((cell, i) => {
          const isWin = status.kind === "won" && status.line.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={status.kind !== "playing" || !!cell}
              aria-label={
                cell ? `Cell ${i + 1}, ${cell}` : `Empty cell ${i + 1}`
              }
              className={`cell ${isWin ? "win" : ""} ${
                isKids ? "kids-cell" : ""
              } ${cell === "X" ? set.xColor : cell === "O" ? set.oColor : ""}`}
            >
              <span
                className={`leading-none select-none font-black ${
                  isKids ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl"
                }`}
              >
                {cell ? symbol(cell) : ""}
              </span>
            </button>
          );
        })}
      </div>

      {!isKids && (
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Score label={set.X} value={scores.X} color={set.xColor} />
          <Score label="Draws" value={scores.draw} color="text-amber-400" />
          <Score label={set.O} value={scores.O} color={set.oColor} />
        </div>
      )}

      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <button
          type="button"
          onClick={reset}
          className={`px-4 py-2 rounded-xl transition font-semibold ${
            isKids
              ? "bg-white text-sky-700 hover:bg-sky-50 shadow-md text-lg"
              : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
          }`}
        >
          {isKids ? "🔄 Play again" : "New round"}
        </button>
        {!isKids && (
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            Reset scores
          </button>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  kids,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  kids: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
        active
          ? kids
            ? "bg-white text-sky-700 shadow"
            : "bg-slate-100 text-slate-900"
          : kids
          ? "text-white/80 hover:text-white"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
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
