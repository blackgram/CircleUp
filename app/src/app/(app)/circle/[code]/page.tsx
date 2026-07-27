"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { roomsApi } from "@/lib/api/services";
import { useEnabledGames } from "@/hooks/useGames";
import { getSocket } from "@/lib/socket/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, Play, LogOut, Crown, Check, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import type { RoomResponse, RoomStatePayload } from "@/types";

export default function CirclePage() {
  const params = useParams();
  const roomCode = params.code as string;
  const { user } = useAuthStore();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectingGame, setSelectingGame] = useState(false);
  const { data: enabledGames } = useEnabledGames();

  useEffect(() => {
    loadRoom();
  }, [roomCode]);

  // Socket: join room channel and listen for updates
  useEffect(() => {
    const socket = getSocket();

    console.log("[CirclePage] Socket connected?", socket.connected, "id:", socket.id);

    function handleRoomUpdate(payload: RoomStatePayload) {
      console.log("[CirclePage] room:update received:", JSON.stringify(payload, null, 2));
      // Detect players who left
      setRoom((prev) => {
        if (!prev) return prev;
        const prevIds = prev.players.map((p) => p.userId);
        const newIds = payload.players.map((p) => p.userId);
        const left = prev.players.filter((p) => !newIds.includes(p.userId));
        left.forEach((p) => {
          toast.info(`${p.nickname} left the circle`);
        });
        return {
          ...prev,
          players: payload.players as RoomResponse["players"],
          status: payload.status as RoomResponse["status"],
          gameSlug: payload.gameSlug,
        };
      });
    }

    socket.on("room:update", handleRoomUpdate);

    // Emit room:join to subscribe to this room's socket channel
    if (socket.connected) {
      console.log("[CirclePage] Emitting room:join for:", roomCode);
      socket.emit("room:join", { roomCode }, (res) => {
        console.log("[CirclePage] room:join ack:", res);
        if (!res.success) {
          console.error("[CirclePage] Failed to join room socket:", res.message);
        }
      });
    } else {
      console.log("[CirclePage] Socket not connected, waiting for connect event...");
      const onConnect = () => {
        console.log("[CirclePage] Socket connected, now emitting room:join for:", roomCode);
        socket.emit("room:join", { roomCode }, (res) => {
          console.log("[CirclePage] room:join ack:", res);
          if (!res.success) {
            console.error("[CirclePage] Failed to join room socket:", res.message);
          }
        });
      };
      socket.on("connect", onConnect);
      return () => {
        socket.off("connect", onConnect);
        socket.off("room:update", handleRoomUpdate);
      };
    }

    return () => {
      socket.off("room:update", handleRoomUpdate);
      // Optionally leave on unmount
      socket.emit("room:leave", (res) => {
        console.log("[CirclePage] room:leave ack:", res);
      });
    };
  }, [roomCode]);

  async function loadRoom() {
    try {
      const { data } = await roomsApi.getByCode(roomCode);
      if (data.success && data.data) {
        setRoom(data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Room not found");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    try {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("room:leave", (res) => {
          console.log("[CirclePage] room:leave ack:", res);
        });
      } else {
        // Fallback to REST if socket not connected
        await roomsApi.leave(roomCode);
      }
      toast.success("Left circle");
      window.location.href = "/dashboard";
    } catch {}
  }

  async function handleStart() {
    try {
      const { data } = await roomsApi.start(roomCode);
      if (data.success) {
        toast.success("Game starting!");
        loadRoom();
      } else {
        toast.error(data.message || "Cannot start game");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cannot start game");
    }
  }

  async function handleSelectGame(slug: string) {
    setSelectingGame(true);
    try {
      const { data } = await roomsApi.updateSettings(roomCode, { gameSlug: slug });
      if (data.success && data.data) {
        setRoom(data.data);
        toast.success("Game selected!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to select game");
    } finally {
      setSelectingGame(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100 max-w-md mx-auto">
        <p className="font-semibold text-slate-700">Room not found</p>
        <p className="text-sm text-slate-500 mt-1">This circle doesn&apos;t exist or has ended.</p>
      </div>
    );
  }

  const isHost = user?.id === room.hostId;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Room Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Circle Room</p>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-extrabold text-slate-900 font-mono tracking-wider">{room.roomCode}</h1>
              <button onClick={copyCode} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              room.status === "WAITING" ? "bg-amber-50 text-amber-700" :
              room.status === "PLAYING" ? "bg-emerald-50 text-emerald-700" :
              "bg-slate-100 text-slate-600"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                room.status === "WAITING" ? "bg-amber-500 animate-pulse" :
                room.status === "PLAYING" ? "bg-emerald-500" : "bg-slate-400"
              }`} />
              {room.status}
            </span>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Players ({room.players.length}/{room.settings.maxPlayers})
        </h3>
        <div className="space-y-3">
          {room.players.map((player) => (
            <div key={player.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  player.connected ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-slate-300"
                }`}>
                  {player.nickname[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {player.nickname}
                    {player.userId === room.hostId && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {player.connected ? "Connected" : "Disconnected"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                player.ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}>
                {player.ready ? "Ready" : "Not Ready"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Selection (host only, while waiting) */}
      {isHost && room.status === "WAITING" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-500" />
            Select Game
          </h3>
          {enabledGames && enabledGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enabledGames.map((game) => {
                const isSelected = room.gameSlug === game.slug;
                const playerCountOk = room.players.length >= game.minPlayers && room.players.length <= game.maxPlayers;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game.slug)}
                    disabled={selectingGame || isSelected}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-100 hover:border-indigo-300 hover:bg-slate-50"
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{game.icon || "🎮"}</span>
                      <p className="text-sm font-bold text-slate-900">{game.name}</p>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 ml-auto" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{game.description}</p>
                    <p className={`text-[10px] mt-2 font-semibold ${playerCountOk ? "text-emerald-600" : "text-amber-600"}`}>
                      {game.minPlayers}–{game.maxPlayers} players
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No games available</p>
          )}
        </div>
      )}

      {/* Show selected game for non-host */}
      {!isHost && room.gameSlug && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-500" />
            Selected Game
          </h3>
          <p className="text-sm font-bold text-indigo-600">{room.gameSlug}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isHost && room.status === "WAITING" && (
          <Button onClick={handleStart} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex-1">
            <Play className="w-4 h-4 mr-2" /> Start Game
          </Button>
        )}
        <Button onClick={handleLeave} variant="outline" className="font-bold rounded-xl text-rose-600 hover:text-rose-700 border-rose-200">
          <LogOut className="w-4 h-4 mr-2" /> Leave
        </Button>
      </div>
    </div>
  );
}
