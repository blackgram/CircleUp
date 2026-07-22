"use client";

import { Gamepad2, Users, Play } from "lucide-react";
import { useEnabledGames } from "@/hooks/useGames";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function GamesPage() {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { data: games, isLoading } = useEnabledGames();

  function handlePlay() {
    if (!isAuthenticated()) {
      openAuthModal();
      return;
    }
    // TODO: create room with game pre-selected
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-indigo-600" /> Games Catalog
        </h2>
        <p className="text-xs text-slate-500">Schema-driven party games for any size group.</p>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : games && games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform">
                    {game.icon || "🎯"}
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {game.minPlayers}–{game.maxPlayers} players
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">{game.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{game.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{game.minPlayers}–{game.maxPlayers}</span>
                </div>
                <Button onClick={handlePlay} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3 py-1.5">
                  <Play className="w-3.5 h-3.5 mr-1" /> Play
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <Gamepad2 className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No games available yet</p>
          <p className="text-sm text-slate-500 mt-1">Games will appear here once an admin creates them.</p>
        </div>
      )}
    </div>
  );
}
