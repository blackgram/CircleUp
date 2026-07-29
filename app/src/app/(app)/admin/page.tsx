"use client";

import { useState } from "react";
import { ShieldCheck, Gamepad2, Users, BarChart2, Plus, Check, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, gamesApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { GameDetailResponse, SettingDefinition } from "@/types";

const SETTING_TYPES = ["boolean", "number", "string", "select"] as const;

interface SettingFormState {
  key: string;
  type: SettingDefinition["type"];
  label: string;
  default: string;
  min: string;
  max: string;
  options: string; // comma-separated "label:value" pairs
}

function emptySettingForm(): SettingFormState {
  return { key: "", type: "boolean", label: "", default: "", min: "", max: "", options: "" };
}

function settingToForm(s: SettingDefinition): SettingFormState {
  return {
    key: s.key,
    type: s.type,
    label: s.label,
    default: String(s.default ?? ""),
    min: s.min != null ? String(s.min) : "",
    max: s.max != null ? String(s.max) : "",
    options: s.options?.map((o) => `${o.label}:${o.value}`).join(", ") ?? "",
  };
}

function formToSetting(f: SettingFormState): SettingDefinition {
  const s: SettingDefinition = { key: f.key, type: f.type, label: f.label, default: parseDefault(f) };
  if (f.type === "number") {
    if (f.min) s.min = Number(f.min);
    if (f.max) s.max = Number(f.max);
  }
  if (f.type === "select" && f.options.trim()) {
    s.options = f.options.split(",").map((pair) => {
      const [label, value] = pair.trim().split(":");
      return { label: label.trim(), value: (value ?? label).trim() };
    });
  }
  return s;
}

function parseDefault(f: SettingFormState): unknown {
  if (f.type === "boolean") return f.default === "true";
  if (f.type === "number") return Number(f.default) || 0;
  return f.default;
}

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", slug: "", description: "", minPlayers: "2", maxPlayers: "8" });
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [settingForms, setSettingForms] = useState<SettingFormState[]>([]);
  const [newSetting, setNewSetting] = useState<SettingFormState>(emptySettingForm());

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: async () => { const { data } = await gamesApi.list(); return data.data || []; },
    enabled: isAdmin(),
  });

  // Fetch detail (with settingsSchema) for the expanded game
  const { data: expandedGameDetail } = useQuery({
    queryKey: ["admin", "games", expandedGameId],
    queryFn: async () => {
      const game = games?.find((g) => g.id === expandedGameId);
      if (!game) return null;
      const { data } = await gamesApi.getBySlug(game.slug);
      return data.data ?? null;
    },
    enabled: !!expandedGameId,
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

  const updateSettingsSchema = useMutation({
    mutationFn: ({ id, settingsSchema }: { id: string; settingsSchema: SettingDefinition[] }) =>
      adminApi.updateGame(id, { settingsSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] });
      if (expandedGameId) queryClient.invalidateQueries({ queryKey: ["admin", "games", expandedGameId] });
      toast.success("Settings schema updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update");
    },
  });

  function handleExpandGame(gameId: string) {
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
      return;
    }
    setExpandedGameId(gameId);
    setNewSetting(emptySettingForm());
    // settingForms will populate from expandedGameDetail via the render
  }

  function handleAddSetting() {
    if (!newSetting.key || !newSetting.label) {
      toast.error("Key and Label are required");
      return;
    }
    const existingSchema = expandedGameDetail?.settingsSchema ?? [];
    const currentSettings = existingSchema.map(settingToForm);
    if (currentSettings.some((s) => s.key === newSetting.key)) {
      toast.error("A setting with this key already exists");
      return;
    }
    const allSettings = [...existingSchema, formToSetting(newSetting)];
    updateSettingsSchema.mutate({ id: expandedGameId!, settingsSchema: allSettings });
    setNewSetting(emptySettingForm());
  }

  function handleRemoveSetting(key: string) {
    const existingSchema = expandedGameDetail?.settingsSchema ?? [];
    const updated = existingSchema.filter((s) => (s as SettingDefinition).key !== key);
    updateSettingsSchema.mutate({ id: expandedGameId!, settingsSchema: updated as SettingDefinition[] });
  }

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
            {games.map((game) => {
              const isExpanded = expandedGameId === game.id;
              const schema = (isExpanded && expandedGameDetail?.settingsSchema) || [];
              return (
                <div key={game.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <button onClick={() => handleExpandGame(game.id)} className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg">
                        {game.icon || "🎯"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{game.name}</p>
                        <p className="text-xs text-slate-500">{game.slug} · {game.minPlayers}–{game.maxPlayers} players</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
                    </button>
                    <button
                      onClick={() => toggleGame.mutate({ id: game.id, enabled: game.enabled })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        game.enabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {game.enabled ? <><Check className="w-3 h-3 inline mr-1" />Enabled</> : <><X className="w-3 h-3 inline mr-1" />Disabled</>}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">Settings Schema</p>

                      {/* Existing settings */}
                      {schema.length > 0 ? (
                        <div className="space-y-2">
                          {schema.map((s) => {
                            const setting = s as SettingDefinition;
                            return (
                              <div key={setting.key} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{setting.label}</p>
                                  <p className="text-[10px] text-slate-500">
                                    <span className="font-mono">{setting.key}</span> · {setting.type}
                                    {setting.type === "number" && setting.min != null && ` · ${setting.min}–${setting.max}`}
                                    {setting.type === "select" && setting.options && ` · ${setting.options.map((o) => o.label).join(", ")}`}
                                    {" · default: "}
                                    {String(setting.default)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveSetting(setting.key)}
                                  className="text-rose-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No custom settings defined.</p>
                      )}

                      {/* Add new setting */}
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold text-slate-500 mb-3">Add Setting</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">Key</Label>
                            <Input
                              value={newSetting.key}
                              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                              placeholder="timeLimit"
                              className="rounded-xl text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">Label</Label>
                            <Input
                              value={newSetting.label}
                              onChange={(e) => setNewSetting({ ...newSetting, label: e.target.value })}
                              placeholder="Time Limit"
                              className="rounded-xl text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">Type</Label>
                            <select
                              value={newSetting.type}
                              onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value as SettingDefinition["type"] })}
                              className="w-full rounded-xl border border-slate-200 px-2 py-1 text-xs h-8 bg-white"
                            >
                              {SETTING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">Default</Label>
                            <Input
                              value={newSetting.default}
                              onChange={(e) => setNewSetting({ ...newSetting, default: e.target.value })}
                              placeholder={newSetting.type === "boolean" ? "true / false" : "value"}
                              className="rounded-xl text-xs h-8"
                            />
                          </div>
                        </div>

                        {newSetting.type === "number" && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-500">Min</Label>
                              <Input type="number" value={newSetting.min} onChange={(e) => setNewSetting({ ...newSetting, min: e.target.value })} className="rounded-xl text-xs h-8" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-500">Max</Label>
                              <Input type="number" value={newSetting.max} onChange={(e) => setNewSetting({ ...newSetting, max: e.target.value })} className="rounded-xl text-xs h-8" />
                            </div>
                          </div>
                        )}

                        {newSetting.type === "select" && (
                          <div className="mt-2 space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">Options (label:value, comma-separated)</Label>
                            <Input
                              value={newSetting.options}
                              onChange={(e) => setNewSetting({ ...newSetting, options: e.target.value })}
                              placeholder="Easy:easy, Medium:medium, Hard:hard"
                              className="rounded-xl text-xs h-8"
                            />
                          </div>
                        )}

                        <Button
                          onClick={handleAddSetting}
                          disabled={!newSetting.key || !newSetting.label || updateSettingsSchema.isPending}
                          className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Setting
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
