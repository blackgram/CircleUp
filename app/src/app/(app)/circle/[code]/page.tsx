"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { roomsApi } from "@/lib/api/services";
import { useEnabledGames, useGameBySlug } from "@/hooks/useGames";
import { getSocket, setCurrentRoomCode } from "@/lib/socket/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, Play, LogOut, Crown, Check, Gamepad2, Settings, ChevronDown, Trophy, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { GameView } from "@/features/games";
import type { RoomResponse, RoomStatePayload, GameStatePayload, SettingDefinition } from "@/types";

export default function CirclePage() {
  const params = useParams();
  const roomCode = params.code as string;
  const { user } = useAuthStore();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectingGame, setSelectingGame] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, unknown>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const { data: enabledGames } = useEnabledGames();
  const { data: gameDetail } = useGameBySlug(room?.gameSlug || "");

  useEffect(() => {
    loadRoom();
  }, [roomCode]);

  // Socket: join room channel and listen for updates
  useEffect(() => {
    const socket = getSocket();

    // Track current room for auto-rejoin on reconnect
    setCurrentRoomCode(roomCode);

    function handleRoomUpdate(payload: RoomStatePayload) {
      console.log("[CirclePage] room:update received:", JSON.stringify(payload, null, 2));
      // Detect players who left
      setRoom((prev) => {
        if (!prev) return prev;
        const left = prev.players.filter((p) => !payload.players.some((np) => np.userId === p.userId));
        left.forEach((p) => {
          toast.info(`${p.nickname} left the circle`);
        });
        return {
          ...prev,
          hostId: payload.hostId,
          players: payload.players as RoomResponse["players"],
          status: payload.status as RoomResponse["status"],
          gameSlug: payload.gameSlug,
          settings: payload.settings as unknown as RoomResponse["settings"],
        };
      });
      // Clear local overrides since server state is now authoritative
      setLocalSettings({});
    }

    function handleGameUpdate(payload: GameStatePayload) {
      console.log("[CirclePage] game:update received:", payload.phase, "round:", payload.currentRound);
      setGameState(payload);
    }

    function handleGameEnded(payload: { finalScores: { userId: string; points: number }[]; winner?: string }) {
      console.log("[CirclePage] game:ended received");
      toast.success("Game finished!");
    }

    function handleKicked(payload: { message: string }) {
      toast.error(payload.message);
      setCurrentRoomCode(null);
      window.location.href = "/dashboard";
    }

    function joinRoom() {
      console.log("[CirclePage] Emitting room:join for:", roomCode);
      socket.emit("room:join", { roomCode }, (res) => {
        console.log("[CirclePage] room:join ack:", res);
        if (!res.success) {
          console.error("[CirclePage] Failed to join room socket:", res.message);
        }
      });
    }

    // Listen for connect event (fires on reconnect or delayed initial connect)
    function onConnect() {
      console.log("[CirclePage] Socket connected, joining room:", roomCode);
      joinRoom();
    }

    socket.on("room:update", handleRoomUpdate);
    socket.on("game:update", handleGameUpdate);
    socket.on("game:ended", handleGameEnded);
    socket.on("room:kicked", handleKicked);
    socket.on("connect", onConnect);

    // Join immediately if connected, otherwise the connect listener above will handle it
    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("room:update", handleRoomUpdate);
      socket.off("game:update", handleGameUpdate);
      socket.off("game:ended", handleGameEnded);
      socket.off("room:kicked", handleKicked);
      socket.off("connect", onConnect);
      setCurrentRoomCode(null);
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

  function handleStart() {
    const socket = getSocket();
    socket.emit("game:start", (res) => {
      if (res.success) {
        toast.success("Game starting!");
      } else {
        toast.error(res.message || "Cannot start game");
      }
    });
  }

  function handleToggleReady() {
    const socket = getSocket();
    socket.emit("player:ready", (res) => {
      if (!res.success) {
        toast.error(res.message || "Failed to toggle ready");
      }
    });
  }

  function handleToggleSpectate() {
    const socket = getSocket();
    socket.emit("player:spectate", (res: any) => {
      if (res.success) {
        toast.success(res.data?.role === "spectator" ? "Now spectating" : "Joined as player");
      } else {
        toast.error(res.message || "Failed to toggle spectator");
      }
    });
  }

  function handleKickPlayer(targetUserId: string, nickname: string) {
    const socket = getSocket();
    socket.emit("room:kick", { userId: targetUserId }, (res) => {
      if (res.success) {
        toast.success(`${nickname} was kicked`);
      } else {
        toast.error(res.message || "Failed to kick player");
      }
    });
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

  async function handleGameOptionChange(key: string, value: unknown) {
    // Update local state immediately for smooth slider
    setLocalSettings((prev) => ({ ...prev, [key]: value }));

    // Debounce the API call
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        const currentOptions = room?.settings.gameOptions || {};
        const updatedOptions = { ...currentOptions, ...localSettings, [key]: value };
        const { data } = await roomsApi.updateSettings(roomCode, { gameOptions: updatedOptions });
        if (data.success && data.data) {
          setRoom(data.data);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update setting");
      }
    }, 400);
  }

  async function handleRoomSettingChange(key: string, value: unknown) {
    // Update local state immediately
    setLocalSettings((prev) => ({ ...prev, [`_room_${key}`]: value }));

    // Debounce the API call
    const timerKey = `_room_${key}`;
    if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
    debounceTimers.current[timerKey] = setTimeout(async () => {
      try {
        const { data } = await roomsApi.updateSettings(roomCode, { [key]: value });
        if (data.success && data.data) {
          setRoom(data.data);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update setting");
      }
    }, 400);
  }

  // Helper to get the current value: local override or room state
  function getGameOption(key: string, fallback: unknown): unknown {
    return localSettings[key] ?? room?.settings.gameOptions[key] ?? fallback;
  }

  function getRoomSetting(key: string): unknown {
    return localSettings[`_room_${key}`] ?? (room?.settings as any)?.[key];
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
  const currentPlayer = room.players.find((p) => p.userId === user?.id);
  const isSpectator = currentPlayer?.role === "spectator";
  const isPlaying = room.status === "PLAYING" || room.status === "FINISHED";

  // ── GAME SCREEN ──
  if (isPlaying) {
    return (
      <GameScreen
        room={room}
        gameState={gameState}
        isHost={isHost}
        isSpectator={isSpectator}
        currentUserId={user?.id || ""}
        onLeave={handleLeave}
      />
    );
  }

  // ── LOBBY SCREEN ──
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              WAITING
            </span>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Players ({room.players.filter((p) => p.role !== "spectator").length}/{room.settings.maxPlayers})
          {room.players.some((p) => p.role === "spectator") && (
            <span className="text-xs font-medium text-violet-500 ml-1">
              + {room.players.filter((p) => p.role === "spectator").length} spectating
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {room.players.map((player) => {
            const isMe = player.userId === user?.id;
            return (
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
                      {player.role === "spectator" && <Eye className="w-3.5 h-3.5 text-violet-500" />}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {player.role === "spectator" ? "Spectating" : player.connected ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                </div>
                {isMe ? (
                  <div className="flex items-center gap-2">
                    {player.role !== "spectator" && (
                      <button
                        onClick={handleToggleReady}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          player.ready
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        {player.ready ? "✓ Ready" : "Ready Up"}
                      </button>
                    )}
                    {player.userId !== room.hostId && (
                      <button
                        onClick={handleToggleSpectate}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          player.role === "spectator"
                            ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        {player.role === "spectator" ? "Join Game" : "Spectate"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      player.role === "spectator" ? "bg-violet-50 text-violet-600" :
                      player.ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {player.role === "spectator" ? "Spectating" : player.ready ? "Ready" : "Not Ready"}
                    </span>
                    {isHost && (
                      <button
                        onClick={() => handleKickPlayer(player.userId, player.nickname)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Kick player"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Selection (host only) */}
      {isHost && (
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

      {/* Game Settings (host only, after game selected) */}
      {isHost && room.gameSlug && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" />
            Game Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Rounds</label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={30} value={Number(getGameOption("rounds", 10))} onChange={(e) => handleGameOptionChange("rounds", Number(e.target.value))} className="flex-1 accent-indigo-600" />
                <span className="text-sm font-bold text-slate-900 w-10 text-center tabular-nums">{Number(getGameOption("rounds", 10))}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Max Players</label>
              <div className="flex items-center gap-3">
                <input type="range" min={2} max={gameDetail?.maxPlayers || 16} value={Number(getRoomSetting("maxPlayers"))} onChange={(e) => handleRoomSettingChange("maxPlayers", Number(e.target.value))} className="flex-1 accent-indigo-600" />
                <span className="text-sm font-bold text-slate-900 w-10 text-center tabular-nums">{Number(getRoomSetting("maxPlayers"))}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Private Room</label>
              <button onClick={() => handleRoomSettingChange("privateRoom", !getRoomSetting("privateRoom"))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getRoomSetting("privateRoom") ? "bg-indigo-600" : "bg-slate-200"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${getRoomSetting("privateRoom") ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {gameDetail?.settingsSchema && gameDetail.settingsSchema.length > 0 && (
              <>
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">{gameDetail.name} Options</p>
                </div>
                {gameDetail.settingsSchema.map((setting: SettingDefinition) => {
                  const currentValue = getGameOption(setting.key, setting.default);
                  return (
                    <div key={setting.key}>
                      <label className="text-sm font-semibold text-slate-700 block mb-1.5">{setting.label}</label>
                      {setting.type === "boolean" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">{currentValue ? "On" : "Off"}</span>
                          <button onClick={() => handleGameOptionChange(setting.key, !currentValue)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentValue ? "bg-indigo-600" : "bg-slate-200"}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${currentValue ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                      )}
                      {setting.type === "number" && (
                        <div className="flex items-center gap-3">
                          <input type="range" min={setting.min ?? 1} max={setting.max ?? 100} value={Number(currentValue) || setting.min || 1} onChange={(e) => handleGameOptionChange(setting.key, Number(e.target.value))} className="flex-1 accent-indigo-600" />
                          <span className="text-sm font-bold text-slate-900 w-10 text-center tabular-nums">{Number(currentValue) || setting.min || 1}</span>
                        </div>
                      )}
                      {setting.type === "select" && setting.options && (
                        <select value={String(currentValue ?? "")} onChange={(e) => handleGameOptionChange(setting.key, e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          {setting.options.map((opt) => (<option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>))}
                        </select>
                      )}
                      {setting.type === "string" && !setting.options && (
                        <input type="text" value={String(currentValue ?? "")} onChange={(e) => handleGameOptionChange(setting.key, e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Show selected game & settings for non-host */}
      {!isHost && room.gameSlug && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-500" />
            Selected Game
          </h3>
          <p className="text-sm font-bold text-indigo-600 mb-3">
            {enabledGames?.find((g) => g.slug === room.gameSlug)?.name || room.gameSlug}
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Rounds</span>
              <span className="font-semibold text-slate-900">{Number(room.settings.gameOptions.rounds) || 10}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Max Players</span>
              <span className="font-semibold text-slate-900">{room.settings.maxPlayers}</span>
            </div>
            {gameDetail?.settingsSchema && gameDetail.settingsSchema.map((setting: SettingDefinition) => {
              const val = room.settings.gameOptions[setting.key] ?? setting.default;
              return (
                <div key={setting.key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{setting.label}</span>
                  <span className="font-semibold text-slate-900">
                    {setting.type === "boolean" ? (val ? "On" : "Off") :
                     setting.type === "select" && setting.options
                       ? (setting.options.find((o) => String(o.value) === String(val))?.label ?? String(val))
                       : String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isHost && (
          <Button onClick={handleStart} disabled={!room.gameSlug} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex-1 disabled:opacity-50">
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

// ── GAME SCREEN COMPONENT ──
function GameScreen({
  room,
  gameState,
  isHost,
  isSpectator,
  currentUserId,
  onLeave,
}: {
  room: RoomResponse;
  gameState: GameStatePayload | null;
  isHost: boolean;
  isSpectator: boolean;
  currentUserId: string;
  onLeave: () => void;
}) {
  const [showPlayers, setShowPlayers] = useState(false);
  const [showScores, setShowScores] = useState(false);

  // Recovery: if room is PLAYING but game state hasn't arrived, re-request it
  useEffect(() => {
    if (!gameState && (room.status === "PLAYING" || room.status === "STARTING")) {
      const timer = setTimeout(() => {
        const socket = getSocket();
        console.log("[GameScreen] No game state, re-joining to recover...");
        socket.emit("room:join", { roomCode: room.roomCode }, (res) => {
          console.log("[GameScreen] Recovery join:", res);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, room.status, room.roomCode]);

  return (
    <div className={`${isSpectator ? "max-w-6xl" : "max-w-3xl"} mx-auto pb-12 space-y-4`}>
      {/* Compact game header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{room.roomCode}</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {room.status === "FINISHED" ? "FINISHED" : "LIVE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScores(!showScores)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${showScores ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <Trophy className="w-3.5 h-3.5" /> Scores
          </button>
          <button
            onClick={() => setShowPlayers(!showPlayers)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${showPlayers ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <Users className="w-3.5 h-3.5" /> {room.players.length}
          </button>
          <button
            onClick={onLeave}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Scores Panel */}
      {showScores && gameState && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-in slide-in-from-top-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Leaderboard</h4>
          <div className="space-y-1.5">
            {[...gameState.scores].sort((a, b) => b.points - a.points).map((s, idx) => (
              <div key={s.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-5 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {room.players.find((p) => p.userId === s.userId)?.nickname || s.userId.slice(0, 6)}
                  </span>
                </div>
                <span className="text-sm font-bold text-indigo-600">{s.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Players Panel */}
      {showPlayers && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-in slide-in-from-top-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Players</h4>
          <div className="flex flex-wrap gap-2">
            {room.players.map((player) => (
              <div key={player.userId} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                <span className={`w-2 h-2 rounded-full ${player.connected ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-xs font-semibold text-slate-700">{player.nickname}</span>
                {player.userId === room.hostId && <Crown className="w-3 h-3 text-amber-500" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game View */}
      {room.gameSlug && gameState ? (
        <GameView
          gameSlug={room.gameSlug}
          room={room}
          gameState={gameState}
          isHost={isHost}
          isSpectator={isSpectator}
          currentUserId={currentUserId}
          onReturnToLobby={() => {
            const socket = getSocket();
            socket.emit("game:action", { action: "return_to_lobby", payload: {} }, (res) => {
              if (!res.success) console.error("Failed to return to lobby:", res.message);
            });
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
          <p className="text-sm font-bold text-slate-700">Waiting for game state...</p>
        </div>
      )}
    </div>
  );
}
