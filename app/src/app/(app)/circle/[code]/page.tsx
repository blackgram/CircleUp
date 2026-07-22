"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { roomsApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, Play, LogOut, Crown, Check } from "lucide-react";
import { toast } from "sonner";
import type { RoomResponse } from "@/types";

export default function CirclePage() {
  const params = useParams();
  const roomCode = params.code as string;
  const { user } = useAuthStore();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRoom();
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
      await roomsApi.leave(roomCode);
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

        {room.gameSlug && (
          <p className="text-sm text-slate-600 mt-3">
            Game: <span className="font-bold text-indigo-600">{room.gameSlug}</span>
          </p>
        )}
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
