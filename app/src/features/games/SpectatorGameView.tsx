/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Users, Trophy, Eye } from "lucide-react";
import type { GameStatePayload, RoomResponse } from "@/types";

interface Props {
  room: RoomResponse;
  gameState: GameStatePayload;
  onReturnToLobby?: () => void;
}

export function SpectatorGameView({ room, gameState, onReturnToLobby }: Props) {
  const phase = gameState.phase;
  const activePlayers = room.players.filter((p) => p.role !== "spectator");

  const getNickname = useCallback(
    (userId: string) => room.players.find((p) => p.userId === userId)?.nickname || userId.slice(0, 6),
    [room.players]
  );

  return (
    <div className="space-y-6">
      {/* Spectator Banner */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl px-5 py-3 flex items-center gap-3">
        <Eye className="w-5 h-5 text-violet-600" />
        <p className="text-sm font-bold text-violet-700">Spectator Mode</p>
        <span className="text-xs text-violet-500 ml-auto">Watching the game live</span>
      </div>

      {/* Main Grid: Question + Scoreboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question / Game State - takes 2 cols */}
        <div className="lg:col-span-2">
          <GamePhasePanel
            phase={phase}
            gameState={gameState}
            room={room}
            activePlayers={activePlayers}
            getNickname={getNickname}
          />
        </div>

        {/* Scoreboard - side panel */}
        <div className="lg:col-span-1">
          <ScoreboardPanel
            gameState={gameState}
            getNickname={getNickname}
          />
        </div>
      </div>

      {/* Players Grid */}
      <PlayersPanel
        room={room}
        activePlayers={activePlayers}
        gameState={gameState}
      />
    </div>
  );
}

// ── Game Phase Panel ──
function GamePhasePanel({
  phase,
  gameState,
  room,
  activePlayers,
  getNickname,
}: {
  phase: string;
  gameState: GameStatePayload;
  room: RoomResponse;
  activePlayers: RoomResponse["players"];
  getNickname: (id: string) => string;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const data = gameState.data as any;

  useEffect(() => {
    if (!gameState.endsAt) {
      setTimeLeft(null);
      return;
    }
    const endTime = new Date(gameState.endsAt).getTime();
    function tick() {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameState.endsAt]);

  if (phase === "STARTING") {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
        <Clock className="w-12 h-12 mx-auto text-indigo-400 mb-4 animate-pulse" />
        <p className="text-xl font-extrabold text-slate-800">Waiting for Host</p>
        <p className="text-sm text-slate-500 mt-2">The host is preparing the next question...</p>
      </div>
    );
  }

  if (phase === "ANSWERING") {
    const question = data?.content?.question || data?.question || "...";
    const submissionCount = data?.submissionCount || 0;

    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
        {/* Round + Timer */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-400 uppercase">
            Round {gameState.currentRound}/{gameState.totalRounds}
          </span>
          {timeLeft !== null && (
            <span className={`flex items-center gap-2 text-lg font-extrabold ${timeLeft <= 5 ? "text-rose-600 animate-pulse" : "text-slate-700"}`}>
              <Clock className="w-5 h-5" /> {timeLeft}s
            </span>
          )}
        </div>

        {/* Question - BIG */}
        <div className="py-8 px-4">
          <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 text-center leading-tight">
            {question}
          </p>
        </div>

        {/* Vote progress */}
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <div className="flex-1 max-w-xs h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
              style={{ width: `${activePlayers.length > 0 ? (submissionCount / activePlayers.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-600">
            {submissionCount}/{activePlayers.length} voted
          </span>
        </div>
      </div>
    );
  }

  if (phase === "RESULTS") {
    const results: { userId: string; votes: number; voters?: string[] }[] = data?.result?.results || data?.results || [];
    const anonymous = data?.result?.anonymous ?? data?.anonymous ?? true;
    const question = data?.result?.question || data?.question || "";
    const totalVotes = data?.result?.totalVotes || data?.totalVotes || results.reduce((sum: number, r: any) => sum + r.votes, 0);
    const maxVotes = results[0]?.votes || 0;

    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-400 uppercase">
            Round {gameState.currentRound}/{gameState.totalRounds} — Results
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Eye className="w-3.5 h-3.5" />
            {anonymous ? "Anonymous" : "Public"}
          </span>
        </div>

        {question && (
          <p className="text-center text-xl font-extrabold text-slate-800">{question}</p>
        )}

        {/* Results - large bars */}
        <div className="space-y-4">
          {results.map((entry, idx) => {
            const isWinner = entry.votes > 0 && entry.votes === maxVotes;
            const barPercent = totalVotes > 0 ? (entry.votes / totalVotes) * 100 : 0;

            return (
              <div
                key={entry.userId}
                className="opacity-0 animate-[fadeSlideIn_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`p-4 rounded-xl ${isWinner ? "bg-amber-50 border-2 border-amber-200" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-2xl font-extrabold text-slate-300 w-8 text-center shrink-0">
                      {isWinner ? "👑" : `#${idx + 1}`}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {getNickname(entry.userId)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 truncate">{getNickname(entry.userId)}</p>
                      {!anonymous && entry.voters && entry.voters.length > 0 && (
                        <p className="text-xs text-slate-500 truncate">
                          Voted by: {entry.voters.map((v: string) => getNickname(v)).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className={`text-lg font-extrabold shrink-0 ${entry.votes > 0 ? "text-indigo-600" : "text-slate-300"}`}>
                      {entry.votes} {entry.votes === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                  {/* Big vote bar */}
                  <div className="ml-12 pl-2">
                    <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isWinner ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-indigo-400 to-indigo-500"
                        }`}
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {results.length === 0 && (
            <p className="text-base text-slate-500 text-center py-6">No votes were cast this round.</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === "FINISHED") {
    const sortedScores = [...gameState.scores].sort((a, b) => b.points - a.points);
    const winner = sortedScores[0];

    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm text-center space-y-6">
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-extrabold text-slate-900">Game Over!</h2>
        {winner && (
          <p className="text-lg text-indigo-600 font-bold">
            {getNickname(winner.userId)} wins with {winner.points} points!
          </p>
        )}
      </div>
    );
  }

  return null;
}

// ── Scoreboard Panel ──
function ScoreboardPanel({
  gameState,
  getNickname,
}: {
  gameState: GameStatePayload;
  getNickname: (id: string) => string;
}) {
  const sortedScores = [...gameState.scores].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        Leaderboard
      </h3>
      <div className="space-y-3">
        {sortedScores.map((s, idx) => (
          <div key={s.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base w-7 text-center font-bold">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
                {getNickname(s.userId)[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-700 truncate max-w-[100px]">
                {getNickname(s.userId)}
              </span>
            </div>
            <span className="text-base font-extrabold text-indigo-600">{s.points}</span>
          </div>
        ))}
        {sortedScores.length === 0 && (
          <p className="text-sm text-slate-400 text-center">No scores yet</p>
        )}
      </div>
    </div>
  );
}

// ── Players Panel ──
function PlayersPanel({
  room,
  activePlayers,
  gameState,
}: {
  room: RoomResponse;
  activePlayers: RoomResponse["players"];
  gameState: GameStatePayload;
}) {
  const data = gameState.data as any;
  const submissionCount = data?.submissionCount || 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-indigo-500" />
        Players ({activePlayers.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {activePlayers.map((player) => {
          const score = gameState.scores.find((s) => s.userId === player.userId)?.points || 0;
          return (
            <div
              key={player.userId}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                player.connected ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-slate-300"
              }`}>
                {player.nickname[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{player.nickname}</p>
                <p className="text-xs text-indigo-500 font-semibold">{score} pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
