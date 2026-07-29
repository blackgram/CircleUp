"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { roomsApi } from "@/lib/api/services";
import { useEnabledGames } from "@/hooks/useGames";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { PlusCircle, Radio, Trophy, Gamepad2, Zap, Flame, Loader2, Users, Globe } from "lucide-react";
import { toast } from "sonner";
import type { RoomResponse } from "@/types";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const { data: enabledGames } = useEnabledGames();

  const { data: publicRooms, isLoading: publicRoomsLoading } = useQuery({
    queryKey: ["rooms", "public"],
    queryFn: async () => {
      const { data } = await roomsApi.getPublic();
      return data.data || [];
    },
    enabled: isAuthenticated(),
    refetchInterval: 15000,
  });

  async function handleCreateClick() {
    if (!isAuthenticated()) {
      openAuthModal();
      return;
    }
    setCreating(true);
    try {
      const { data } = await roomsApi.create({ maxPlayers: 8, privateRoom: true });
      if (data.success && data.data) {
        toast.success(`Circle created! Code: ${data.data.roomCode}`);
        router.push(`/circle/${data.data.roomCode}`);
      } else {
        toast.error(data.message || "Failed to create circle");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create circle");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated()) {
      openAuthModal();
      return;
    }
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const { data } = await roomsApi.join(joinCode.trim());
      if (data.success && data.data) {
        toast.success(`Joined circle ${data.data.roomCode}!`);
        router.push(`/circle/${data.data.roomCode}`);
      } else {
        toast.error(data.message || "Failed to join circle");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to join circle");
    } finally {
      setJoining(false);
    }
  }

  const stats = user
    ? [
        { label: "Played", value: user.gamesPlayed, icon: Gamepad2, color: "indigo" },
        { label: "Won", value: user.gamesWon, icon: Trophy, color: "emerald" },
        { label: "Win Rate", value: user.gamesPlayed > 0 ? `${Math.round((user.gamesWon / user.gamesPlayed) * 100)}%` : "—", icon: Zap, color: "cyan" },
      ]
    : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-indigo-100 backdrop-blur-md">
              <Image src="/logo.png" alt="" width={14} height={14} />
              <span>Multiplayer Social Party Gaming</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready for game night{user ? `, ${user.displayName}` : ""}?
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Create a private circle room, invite your friends with a code, and jump into party games in real time!
            </p>
          </div>

          {/* Quick Action Box */}
          <div className="w-full lg:w-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={handleCreateClick}
              disabled={creating}
              className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl px-4 py-2.5"
            >
              {creating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-1.5" />}
              {creating ? "Creating..." : "Create Circle"}
            </Button>

            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="text"
                placeholder="Room Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full sm:w-36 bg-white/20 text-white placeholder-indigo-200 text-xs font-mono font-bold px-3 py-2.5 rounded-xl border-white/20 focus:ring-2 focus:ring-white"
              />
              <Button
                type="submit"
                disabled={!joinCode.trim() || joining}
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs px-3 py-2.5 rounded-xl disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Radio className="w-3.5 h-3.5 mr-1" />}
                {joining ? "..." : "Join"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Stats Section - only for authenticated users */}
      {stats && (
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Player Statistics
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className={`p-2.5 w-fit rounded-xl bg-${stat.color}-50 text-${stat.color}-600 mb-2`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Games Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-500" /> Games
          </h3>
        </div>
        {enabledGames && enabledGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {enabledGames.map((game) => (
              <div key={game.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg">
                  {game.icon || "🎮"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{game.name}</p>
                  <p className="text-xs text-slate-500">{game.minPlayers}–{game.maxPlayers} players</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 shadow-sm border border-slate-100">
            <Gamepad2 className="w-8 h-8 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No games available yet</p>
            <p className="text-sm mt-1">Check back soon — new games are coming!</p>
          </div>
        )}
      </div>

      {/* Public Rooms Section */}
      {isAuthenticated() && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" /> Public Circles
            </h3>
            <span className="text-xs text-slate-400 font-medium">{publicRooms?.length || 0} open</span>
          </div>
          {publicRoomsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : publicRooms && publicRooms.length > 0 ? (
            <div className="space-y-3">
              {publicRooms.map((room: RoomResponse) => (
                <div key={room.roomCode} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 font-mono">{room.roomCode}</p>
                        {room.gameSlug && (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                            {enabledGames?.find((g) => g.slug === room.gameSlug)?.name || room.gameSlug}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {room.players.length}/{room.settings.maxPlayers} players
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const { data } = await roomsApi.join(room.roomCode);
                        if (data.success) {
                          router.push(`/circle/${room.roomCode}`);
                        }
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || "Failed to join");
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-3"
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
              <Globe className="w-6 h-6 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No public circles right now</p>
              <p className="text-xs text-slate-400 mt-1">Create one and set it to public!</p>
            </div>
          )}
        </div>
      )}

      {/* Not logged in prompt */}
      {!user && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            <button onClick={openAuthModal} className="font-bold text-indigo-600 hover:underline">Sign in</button>
            {" "}to track your stats, add friends, and create circles.
          </p>
        </div>
      )}
    </div>
  );
}
