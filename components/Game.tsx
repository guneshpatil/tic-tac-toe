"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AiLevel, Board, GameConfig } from "@/lib/types";
import {
  STORAGE_KEYS,
  aiMove,
  emptyBoard,
  emptyScores,
  getStatus,
  nextTurn,
} from "@/lib/game";

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

const SIZE_OPTIONS = [3, 4, 5] as const;
const AI_LEVELS: AiLevel[] = ["off", "easy", "hard"];

export default function Game() {
  const [board, setBoard] = useState<Board>(() => emptyBoard(3));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [scores, setScores] = useState<Scores>(emptyScores);
  const [mode, setMode] = useState<Mode>("adult");
  const [setId, setSetId] = useState<PlayerSet["id"]>("classic");
  const [size, setSize] = useState<number>(3);
  const [ai, setAi] = useState<AiLevel>("off");
  const [hydrated, setHydrated] = useState(false);
  const prevIsKidsRef = useRef(mode === "kids");

  const isKids = mode === "kids";
  const config: GameConfig = useMemo(
    () => ({ size, winLength: size, ai, aiPlayer: "O" }),
    [size, ai]
  );

  const set = useMemo(
    () =>
      isKids
        ? PLAYER_SETS.find((s) => s.id === setId) ?? PLAYER_SETS[0]
        : PLAYER_SETS[0],
    [setId, isKids]
  );

  useEffect(() => {
    if (!hydrated) return;
    const wasKids = prevIsKidsRef.current;
    prevIsKidsRef.current = isKids;

    if (wasKids && !isKids) {
      if (setId !== "classic") setSetId("classic");
    }
    if (!wasKids && isKids) {
      if (size !== 3) setSize(3);
      if (ai !== "off") setAi("off");
    }
    if (wasKids !== isKids) {
      setBoard(emptyBoard(size));
      setTurn("X");
    }
  }, [isKids, hydrated, setId, size, ai]);

  useEffect(() => {
    try {
      const rawScores = localStorage.getItem(STORAGE_KEYS.score);
      if (rawScores) setScores({ ...emptyScores(), ...JSON.parse(rawScores) });
      const rawMode = localStorage.getItem(STORAGE_KEYS.mode) as Mode | null;
      if (rawMode === "adult" || rawMode === "kids") setMode(rawMode);
      const rawSet = localStorage.getItem(STORAGE_KEYS.set) as PlayerSet["id"] | null;
      if (rawSet && PLAYER_SETS.some((s) => s.id === rawSet)) setSetId(rawSet);
      const rawSize = Number(localStorage.getItem(STORAGE_KEYS.size));
      if (rawSize === 3 || rawSize === 4 || rawSize === 5) setSize(rawSize);
      const rawAi = localStorage.getItem(STORAGE_KEYS.ai) as AiLevel | null;
      if (rawAi && AI_LEVELS.includes(rawAi)) setAi(rawAi);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.score, JSON.stringify(scores));
    } catch {}
  }, [scores, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.mode, mode);
    } catch {}
  }, [mode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isKids) localStorage.setItem(STORAGE_KEYS.set, setId);
      else localStorage.removeItem(STORAGE_KEYS.set);
    } catch {}
  }, [setId, isKids, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (!isKids) localStorage.setItem(STORAGE_KEYS.size, String(size));
      else localStorage.removeItem(STORAGE_KEYS.size);
    } catch {}
  }, [size, isKids, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (!isKids) localStorage.setItem(STORAGE_KEYS.ai, ai);
      else localStorage.removeItem(STORAGE_KEYS.ai);
    } catch {}
  }, [ai, isKids, hydrated]);

  const status = useMemo(
    () => getStatus(board, turn, config),
    [board, turn, config]
  );

  const aiThinkingRef = useRef(false);

  const play = useCallback(
    (i: number) => {
      if (status.kind !== "playing" || board[i]) return;
      setBoard((prev) => {
        if (prev[i]) return prev;
        const next = prev.slice();
        next[i] = turn;
        return next;
      });
      setTurn((t) => nextTurn(t));
    },
    [board, turn, status]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (ai === "off") return;
    if (status.kind !== "playing") return;
    if (turn !== "O") return;
    if (aiThinkingRef.current) return;
    aiThinkingRef.current = true;
    const t = setTimeout(() => {
      setBoard((prev) => {
        const move = aiMove(prev, config, ai);
        if (move == null || prev[move]) return prev;
        const next = prev.slice();
        next[move] = "O";
        return next;
      });
      setTurn((t) => nextTurn(t));
      aiThinkingRef.current = false;
    }, 350);
    return () => {
      clearTimeout(t);
      aiThinkingRef.current = false;
    };
  }, [turn, status, ai, config, hydrated]);

  const reset = useCallback(() => {
    setBoard(emptyBoard(size));
    setTurn("X");
  }, [size]);

  const resetAll = useCallback(() => {
    reset();
    setScores(emptyScores());
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

        {!isKids && (
          <div className="mt-5 space-y-4 text-left">
            <Slider
              label="Board size"
              options={SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} × ${n}` }))}
              value={size}
              onChange={(v) => {
                setSize(v);
                setBoard(emptyBoard(v));
                setTurn("X");
              }}
            />
            <Slider
              label="AI opponent"
              options={AI_LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))}
              value={ai}
              onChange={(v) => setAi(v)}
            />
          </div>
        )}

        {isKids && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setAi(ai === "off" ? "easy" : "off")}
              aria-pressed={ai !== "off"}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                ai !== "off"
                  ? "bg-white text-sky-700 shadow"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <span aria-hidden>{ai !== "off" ? "🤖" : "👥"}</span>
              <span>{ai !== "off" ? "vs Computer (Easy)" : "vs Friend"}</span>
            </button>
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
        className={`grid rounded-3xl shadow-xl ${
          isKids
            ? "gap-2 sm:gap-3 p-2 sm:p-3 bg-white/40 backdrop-blur-sm"
            : "gap-2 p-2 bg-slate-900/60 border border-slate-800"
        }`}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Tic tac toe board ${size} by ${size}`}
      >
        {board.map((cell, i) => {
          const isWin = status.kind === "won" && status.line.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={status.kind !== "playing" || !!cell || (ai !== "off" && turn === "O")}
              aria-label={
                cell ? `Cell ${i + 1}, ${cell}` : `Empty cell ${i + 1}`
              }
              className={`cell ${isWin ? "win" : ""} ${
                isKids ? "kids-cell" : ""
              } ${cell === "X" ? set.xColor : cell === "O" ? set.oColor : ""} ${
                size >= 4 ? "text-3xl sm:text-4xl" : ""
              }`}
            >
              <span
                className={`leading-none select-none font-black ${
                  isKids
                    ? size >= 4
                      ? "text-4xl sm:text-5xl"
                      : "text-6xl sm:text-7xl"
                    : size >= 4
                    ? "text-3xl sm:text-4xl"
                    : "text-5xl sm:text-6xl"
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
          <Score label={ai !== "off" ? "🤖" : set.O} value={scores.O} color={set.oColor} />
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

function Slider<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">
        {label}
      </div>
      <div className="relative">
        <div className="flex p-1 rounded-full bg-slate-800 border border-slate-700">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onChange(opt.value)}
                aria-pressed={active}
                className={`flex-1 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                  active
                    ? "bg-slate-100 text-slate-900 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
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
