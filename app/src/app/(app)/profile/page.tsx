"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Gamepad2, Trophy, Zap, Calendar, Edit2, Save, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { usersApi } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", nickname: "" });
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated() || !user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-600" /> Profile
        </h1>
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <User className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Your profile</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Sign in to view and edit your profile.</p>
          <Button onClick={openAuthModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Sign In</Button>
        </div>
      </div>
    );
  }

  function startEditing() {
    setForm({ displayName: user!.displayName, nickname: user!.nickname });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await usersApi.updateMe({
        displayName: form.displayName,
        nickname: form.nickname,
      });
      if (data.success && data.data) {
        setUser(data.data);
      }
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  const winRate = user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
        <User className="w-6 h-6 text-indigo-600" /> Profile
      </h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg">
              {user.displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 pt-12">
              {editing ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">Display Name</Label>
                    <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">Nickname</Label>
                    <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3">
                      <Save className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="outline" className="text-xs font-bold rounded-xl px-3">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">{user.displayName}</h2>
                    <p className="text-sm text-slate-500">@{user.nickname}</p>
                  </div>
                  <Button onClick={startEditing} variant="outline" className="text-xs font-bold rounded-xl px-3">
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Gamepad2} label="Played" value={user.gamesPlayed} color="indigo" />
        <StatCard icon={Trophy} label="Won" value={user.gamesWon} color="emerald" />
        <StatCard icon={Zap} label="Win Rate" value={`${winRate}%`} color="cyan" />
        <StatCard icon={Calendar} label="Joined" value={new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })} color="violet" />
      </div>

      {/* Sign Out */}
      <Button
        onClick={() => { logout(); router.push("/dashboard"); }}
        variant="outline"
        className="w-full rounded-xl font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
      <div className={`p-2.5 w-fit rounded-xl bg-${color}-50 text-${color}-600 mx-auto mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
