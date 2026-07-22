"use client";

import { useState } from "react";
import { ShieldCheck, Gamepad2, Users, BarChart2, Plus, Check, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, gamesApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", slug: "", description: "", minPlayers: "2", maxPlayers: "8" });

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: async () => { const { data } = await gamesApi.list(); return data.data || []; },
    enabled: isAdmin(),
  });

  const { data: analytics } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => { const { data } = await adminApi.getAnalytics(); return data.data; },
    enabled: isAdmin(),
  });

  const createGame = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createGame(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] });
      setShowCreateForm(false);
      setNewGame({ name: "", slug: "", description: "", minPlayers: "2", maxPlayers: "8" });
    },
  });

  const toggleGame = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? adminApi.disableGame(id) : adminApi.enableGame(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "games"] }),
  });

  if (!isAuthenticated()) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-3" />
        <p className="font-semibold text-slate-700">Admin Panel</p>
        <p className="text-sm text-slate-500 mt-1 mb-4">Sign in with an admin account.</p>
        <Button onClick={openAuthModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Sign In</Button>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-3" />
        <p className="font-semibold text-slate-700">Access Denied</p>
        <p className="text-sm text-slate-500 mt-1">You need admin privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-indigo-600" /> Admin Panel
      </h2>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <Users className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
            <p className="text-xl font-extrabold text-slate-900">{analytics.totalUsers}</p>
            <p className="text-xs font-semibold text-slate-500">Total Users</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <BarChart2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-extrabold text-slate-900">{analytics.activeRooms}</p>
            <p className="text-xs font-semibold text-slate-500">Active Rooms</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <Gamepad2 className="w-5 h-5 mx-auto text-violet-500 mb-1" />
            <p className="text-xl font-extrabold text-slate-900">{games?.length || 0}</p>
            <p className="text-xs font-semibold text-slate-500">Games</p>
          </div>
        </div>
      )}

      {/* Game Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Game Definitions</h3>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Game
          </Button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Name</Label>
                <Input value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} placeholder="G Trivia" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Slug</Label>
                <Input value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })} placeholder="g-trivia" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Description</Label>
              <Input value={newGame.description} onChange={(e) => setNewGame({ ...newGame, description: e.target.value })} placeholder="A fun trivia game..." className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Min Players</Label>
                <Input type="number" value={newGame.minPlayers} onChange={(e) => setNewGame({ ...newGame, minPlayers: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Max Players</Label>
                <Input type="number" value={newGame.maxPlayers} onChange={(e) => setNewGame({ ...newGame, maxPlayers: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <Button
              onClick={() => createGame.mutate({ ...newGame, minPlayers: +newGame.minPlayers, maxPlayers: +newGame.maxPlayers })}
              disabled={!newGame.name || !newGame.slug || !newGame.description}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
            >
              Create Game
            </Button>
          </div>
        )}

        {gamesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : games && games.length > 0 ? (
          <div className="space-y-3">
            {games.map((game) => (
              <div key={game.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg">
                    {game.icon || "🎯"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{game.name}</p>
                    <p className="text-xs text-slate-500">{game.slug} · {game.minPlayers}–{game.maxPlayers} players</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleGame.mutate({ id: game.id, enabled: game.enabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    game.enabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {game.enabled ? <><Check className="w-3 h-3 inline mr-1" />Enabled</> : <><X className="w-3 h-3 inline mr-1" />Disabled</>}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
            <Gamepad2 className="w-8 h-8 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No games created yet</p>
            <p className="text-sm text-slate-500 mt-1">Click &quot;New Game&quot; to add your first game.</p>
          </div>
        )}
      </div>
    </div>
  );
}
