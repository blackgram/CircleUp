/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  PlusCircle,
  Radio,
  Trophy,
  Gamepad2,
  Zap,
  Loader2,
  Users,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
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

  // Stat mapping with safe color utility classes to prevent Tailwind purge bugs
  const stats = user
    ? [
        {
          label: "Games Played",
          value: user.gamesPlayed,
          icon: Gamepad2,
          bg: "bg-indigo-50/80 dark:bg-indigo-950/40",
          text: "text-indigo-600 dark:text-indigo-400",
          border: "border-indigo-100 dark:border-indigo-900/50",
        },
        {
          label: "Games Won",
          value: user.gamesWon,
          icon: Trophy,
          bg: "bg-amber-50/80 dark:bg-amber-950/40",
          text: "text-amber-600 dark:text-amber-400",
          border: "border-amber-100 dark:border-amber-900/50",
        },
        {
          label: "Win Rate",
          value:
            user.gamesPlayed > 0
              ? `${Math.round((user.gamesWon / user.gamesPlayed) * 100)}%`
              : "—",
          icon: Zap,
          bg: "bg-emerald-50/80 dark:bg-emerald-950/40",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-100 dark:border-emerald-900/50",
        },
      ]
    : null;

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white p-6 sm:p-10 shadow-2xl shadow-indigo-500/20 border border-white/10">
        {/* Decorative Background Lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-semibold text-indigo-100">
              <Image src="/logo.png" alt="" width={16} height={16} className="rounded" />
              <span>Multiplayer Party Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready for game night
              {user?.displayName ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                  , {user.displayName}
                </span>
              ) : (
                "?"
              )}
            </h1>

            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
              Create a private circle room, invite your group via a code, and jump right into party games in real time!
            </p>
          </div>

          {/* Action Box Card */}
          <div className="w-full xl:w-auto bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={handleCreateClick}
              disabled={creating}
              className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs sm:text-sm rounded-xl px-5 py-6 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2 text-indigo-600" />
              )}
              {creating ? "Creating Circle..." : "Create Circle"}
            </Button>

            <div className="hidden sm:block w-px h-8 bg-white/20" />

            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-40">
                <Input
                  type="text"
                  placeholder="ROOM CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full uppercase tracking-wider bg-black/20 text-white placeholder:text-indigo-200/60 text-xs font-mono font-bold px-3 py-5 rounded-xl border-white/15 focus-visible:ring-2 focus-visible:ring-amber-300"
                />
              </div>

              <Button
                type="submit"
                disabled={!joinCode.trim() || joining}
                className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold text-xs sm:text-sm px-4 py-6 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Radio className="w-4 h-4 mr-1.5" /> Join
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* User Stats Section */}
      {stats && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Player Performance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${stat.border} transition-all hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Games Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Available Party Games
            </h2>
          </div>
          {enabledGames && enabledGames.length > 0 && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {enabledGames.length} Available
            </span>
          )}
        </div>

        {enabledGames && enabledGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledGames.map((game) => (
              <div
                key={game.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    {game.icon || "🎮"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" />
                      {game.minPlayers}–{game.maxPlayers} players
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No games active</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check back soon — new games are continuously added!
            </p>
          </div>
        )}
      </section>

      {/* Public Rooms Section */}
      {isAuthenticated() && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Public Circles
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-full">
              {publicRooms?.length || 0} active
            </span>
          </div>

          {publicRoomsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : publicRooms && publicRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {publicRooms.map((room: RoomResponse) => (
                <div
                  key={room.roomCode}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-wide">
                          #{room.roomCode}
                        </span>
                        {room.gameSlug && (
                          <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {enabledGames?.find((g) => g.slug === room.gameSlug)?.name ||
                              room.gameSlug}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {room.players.length}/{room.settings.maxPlayers} players connected
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 py-2 shadow-sm"
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
              <Globe className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No public circles right now
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create your own circle and open it up to everyone!
              </p>
            </div>
          )}
        </section>
      )}

      {/* Guest Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 shadow-sm border border-indigo-100/80 dark:border-indigo-900/50 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Unlock full features
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in to track your win rate, manage game history, and create custom circles.
              </p>
            </div>
          </div>
          <Button
            onClick={openAuthModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md shadow-indigo-600/20 whitespace-nowrap"
          >
            Sign In Now
          </Button>
        </div>
      )}
    </div>
  );
}