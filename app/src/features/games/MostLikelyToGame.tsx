/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Send, Users, Trophy, Eye, EyeOff } from "lucide-react";
import type { GameStatePayload, RoomResponse } from "@/types";

interface Props {
  room: RoomResponse;
  gameState: GameStatePayload;
  isHost: boolean;
  currentUserId: string;
  onReturnToLobby?: () => void;
}

export function MostLikelyToGame({ room, gameState, isHost, currentUserId, onReturnToLobby }: Props) {
  const phase = gameState.phase;

  if (phase === "STARTING") {
    return <StartingPhase isHost={isHost} />;
  }

  if (phase === "ANSWERING") {
    return (
      <AnsweringPhase
        room={room}
        gameState={gameState}
        currentUserId={currentUserId}
      />
    );
  }

  if (phase === "RESULTS") {
    return (
      <ResultsPhase
        room={room}
        gameState={gameState}
        isHost={isHost}
        onReturnToLobby={onReturnToLobby}
      />
    );
  }

  if (phase === "FINISHED") {
    return <FinishedPhase gameState={gameState} room={room} isHost={isHost} onReturnToLobby={onReturnToLobby} />;
  }

  return null;
}

// ── STARTING PHASE ──
// Host enters a question to kick off the round
function StartingPhase({ isHost }: { isHost: boolean }) {
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  function handleSubmitQuestion() {
    if (!question.trim()) return;
    setSending(true);
    const socket = getSocket();
    socket.emit("game:action", { action: "start_round", payload: { question: question.trim() } }, (res) => {
      setSending(false);
      if (!res.success) {
        console.error("Failed to start round:", res.message);
      }
      setQuestion("");
    });
  }

  if (!isHost) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
        <Clock className="w-8 h-8 mx-auto text-indigo-400 mb-3 animate-pulse" />
        <p className="text-sm font-bold text-slate-700">Waiting for the host to start the round...</p>
        <p className="text-xs text-slate-500 mt-1">The host is typing a question</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900">Start a Round</h3>
      <p className="text-xs text-slate-500">Type a &quot;Most Likely To&quot; question for everyone to vote on.</p>
      <div className="flex items-center gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
          placeholder="Who's most likely to..."
          className="flex-1 rounded-xl"
          disabled={sending}
        />
        <Button
          onClick={handleSubmitQuestion}
          disabled={!question.trim() || sending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── ANSWERING PHASE ──
// All players see the question and vote for a player
function AnsweringPhase({
  room,
  gameState,
  currentUserId,
}: {
  room: RoomResponse;
  gameState: GameStatePayload;
  currentUserId: string;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const question = (gameState.data as any)?.content?.question || (gameState.data as any)?.question || "...";
  const submissionCount = (gameState.data as any)?.submissionCount || 0;

  // Timer countdown
  useEffect(() => {
    if (!gameState.endsAt) return;
    const endTime = new Date(gameState.endsAt).getTime();

    function tick() {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameState.endsAt]);

  function handleVote(userId: string) {
    if (submitted) return;
    setSelectedPlayer(userId);
  }

  function handleSubmit() {
    if (!selectedPlayer || submitted) return;
    setSubmitted(true);
    const socket = getSocket();
    socket.emit("game:action", { action: "vote", payload: { votedFor: selectedPlayer } }, (res) => {
      if (!res.success) {
        setSubmitted(false);
        console.error("Vote failed:", res.message);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
      {/* Timer */}
      {timeLeft !== null && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Round {gameState.currentRound}/{gameState.totalRounds}</span>
          <span className={`flex items-center gap-1 text-sm font-bold ${timeLeft <= 5 ? "text-rose-600 animate-pulse" : "text-slate-700"}`}>
            <Clock className="w-4 h-4" /> {timeLeft}s
          </span>
        </div>
      )}

      {/* Question */}
      <div className="text-center py-4">
        <p className="text-lg font-extrabold text-slate-900">{question}</p>
      </div>

      {/* Player options */}
      {!submitted ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map((player) => (
              <button
                key={player.userId}
                onClick={() => handleVote(player.userId)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPlayer === player.userId
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-100 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
                    {player.nickname[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">{player.nickname}</p>
                </div>
              </button>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlayer}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
          >
            Lock In Vote
          </Button>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm font-bold text-emerald-600">Vote submitted!</p>
          <p className="text-xs text-slate-500 mt-1">
            <Users className="w-3 h-3 inline mr-1" />
            {submissionCount}/{room.players.length} voted
          </p>
        </div>
      )}
    </div>
  );
}

// ── RESULTS PHASE ──
function ResultsPhase({
  room,
  gameState,
  isHost,
  onReturnToLobby,
}: {
  room: RoomResponse;
  gameState: GameStatePayload;
  isHost: boolean;
  onReturnToLobby?: () => void;
}) {
  const data = gameState.data as any;
  const results: { userId: string; votes: number; voters?: string[] }[] = data?.result?.results || data?.results || [];
  const anonymous = data?.result?.anonymous ?? data?.anonymous ?? true;
  const question = data?.result?.question || data?.question || "";
  const totalVotes = data?.result?.totalVotes || data?.totalVotes || results.reduce((sum, r) => sum + r.votes, 0);
  const exposedRecap = data?.exposedRecap as { roundNumber: number; question: string; results: { userId: string; votes: number; voters: string[] }[] }[] | undefined;
  const [sending, setSending] = useState(false);
  const [nextQuestion, setNextQuestion] = useState("");
  const [showBars, setShowBars] = useState(false);
  const [exposing, setExposing] = useState(false);

  // Trigger staggered animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowBars(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getNickname = useCallback(
    (userId: string) => room.players.find((p) => p.userId === userId)?.nickname || userId.slice(0, 6),
    [room.players]
  );

  function handleNextRound() {
    if (!nextQuestion.trim()) return;
    setSending(true);
    const socket = getSocket();
    socket.emit("game:action", { action: "start_round", payload: { question: nextQuestion.trim() } }, (res) => {
      setSending(false);
      if (!res.success) console.error("Failed:", res.message);
      setNextQuestion("");
    });
  }

  function handleExpose() {
    setExposing(true);
    const socket = getSocket();
    socket.emit("game:action", { action: "expose_results", payload: {} }, (res) => {
      setExposing(false);
      if (!res.success) console.error("Failed to expose:", res.message);
    });
  }

  const maxVotes = results[0]?.votes || 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase">Round {gameState.currentRound}/{gameState.totalRounds} — Results</span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          {anonymous ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {anonymous ? "Anonymous" : "Public"}
        </span>
      </div>

      {question && (
        <p className="text-center text-base font-bold text-slate-800">{question}</p>
      )}

      {/* Ranked results with animated bars */}
      <div className="space-y-3">
        {results.map((entry, idx) => {
          const isWinner = entry.votes > 0 && entry.votes === maxVotes;
          const barPercent = totalVotes > 0 ? (entry.votes / totalVotes) * 100 : 0;

          return (
            <div
              key={entry.userId}
              className="opacity-0 animate-[fadeSlideIn_0.4s_ease-out_forwards]"
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              <div className={`p-3 rounded-xl ${isWinner ? "bg-amber-50 border border-amber-200" : "bg-slate-50"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-extrabold text-slate-400 w-6 text-center shrink-0">
                    {isWinner ? "👑" : `#${idx + 1}`}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {getNickname(entry.userId)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{getNickname(entry.userId)}</p>
                    {!anonymous && entry.voters && entry.voters.length > 0 && (
                      <p className="text-[10px] text-slate-500 truncate">
                        Voted by: {entry.voters.map((v: string) => getNickname(v)).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-extrabold shrink-0 ${entry.votes > 0 ? "text-indigo-600" : "text-slate-300"}`}>
                    {entry.votes}
                  </span>
                </div>
                {/* Vote bar */}
                <div className="ml-9 pl-2">
                  <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isWinner ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-indigo-400 to-indigo-500"
                      }`}
                      style={{ width: showBars ? `${barPercent}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {results.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No votes were cast this round.</p>
        )}
      </div>

      {/* Host: start next round */}
      {isHost && gameState.currentRound < gameState.totalRounds && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-xs font-bold text-slate-500">Next Question</p>
          <div className="flex items-center gap-2">
            <Input
              value={nextQuestion}
              onChange={(e) => setNextQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNextRound()}
              placeholder="Who's most likely to..."
              className="flex-1 rounded-xl"
              disabled={sending}
            />
            <Button
              onClick={handleNextRound}
              disabled={!nextQuestion.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Last round: expose option and return to lobby */}
      {gameState.currentRound >= gameState.totalRounds && (
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <p className="text-xs font-bold text-slate-500 text-center">That was the final round!</p>

          {/* Expose button (host only, anonymous games, not yet exposed) */}
          {isHost && anonymous && !exposedRecap && (
            <Button
              onClick={handleExpose}
              disabled={exposing}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
            >
              <Eye className="w-4 h-4 mr-2" /> Expose All Votes
            </Button>
          )}

          {/* Exposed recap: full round-by-round breakdown */}
          {exposedRecap && (
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <p className="text-sm font-bold text-violet-700 flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4" /> Votes Exposed!
                </p>
              </div>
              {exposedRecap.map((round) => (
                <div
                  key={round.roundNumber}
                  className="bg-slate-50 rounded-xl p-4 space-y-2 opacity-0 animate-[fadeSlideIn_0.4s_ease-out_forwards]"
                  style={{ animationDelay: `${(round.roundNumber - 1) * 150}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">ROUND {round.roundNumber}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{round.question}</p>
                  <div className="space-y-1.5 pt-1">
                    {round.results.filter((r) => r.votes > 0).map((entry) => (
                      <div key={entry.userId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{getNickname(entry.userId)}</span>
                          <span className="text-slate-400">— {entry.votes} vote{entry.votes !== 1 ? "s" : ""}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          by {entry.voters.map((v) => getNickname(v)).join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isHost && onReturnToLobby && (
            <Button
              onClick={onReturnToLobby}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Return to Lobby
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── FINISHED PHASE ──
function FinishedPhase({ gameState, room, isHost, onReturnToLobby }: { gameState: GameStatePayload; room: RoomResponse; isHost: boolean; onReturnToLobby?: () => void }) {
  const sorted = [...gameState.scores].sort((a, b) => b.points - a.points);
  const getNickname = (userId: string) => room.players.find((p) => p.userId === userId)?.nickname || userId.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
      <div className="text-center">
        <Trophy className="w-10 h-10 mx-auto text-amber-500 mb-2" />
        <h3 className="text-lg font-extrabold text-slate-900">Game Over!</h3>
        <p className="text-xs text-slate-500">Final Standings</p>
      </div>

      <div className="space-y-2">
        {sorted.map((entry, idx) => (
          <div
            key={entry.userId}
            className={`flex items-center justify-between p-3 rounded-xl ${
              idx === 0 ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold w-6 text-center">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
                {getNickname(entry.userId)[0]?.toUpperCase()}
              </div>
              <p className="text-sm font-bold text-slate-900">{getNickname(entry.userId)}</p>
            </div>
            <span className="text-sm font-extrabold text-indigo-600">{entry.points} pts</span>
          </div>
        ))}
      </div>

      {isHost && onReturnToLobby && (
        <Button
          onClick={onReturnToLobby}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
        >
          Return to Lobby
        </Button>
      )}
    </div>
  );
}
