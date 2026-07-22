import React, { useState } from 'react';
import { User as UserIcon, Trophy, Flame, Zap, Shield, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export const UserProfileView: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [nicknameInput, setNicknameInput] = useState(user?.nickname || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: displayNameInput.trim(),
      nickname: nicknameInput.trim(),
      avatarUrl: avatarUrlInput.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!user) return null;

  const stats = user.stats || {
    gamesPlayed: 42,
    gamesWon: 27,
    winRate: 64,
    currentStreak: 5,
    favoriteGame: 'Trivia Master',
  };

  const sampleAchievements = [
    { id: 'a1', title: 'First Circle Win', icon: '🏆', desc: 'Won your first party game match', unlocked: true },
    { id: 'a2', title: '5-Game Streak', icon: '🔥', desc: 'Won 5 consecutive games in a row', unlocked: true },
    { id: 'a3', title: 'Circle Mastermind', icon: '🧠', desc: 'Scored over 5,000 points in Trivia', unlocked: true },
    { id: 'a4', title: 'Party Host', icon: '👑', desc: 'Hosted 10 private circles', unlocked: false },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <Card className="p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 text-white border-0">
        <div className="flex flex-col sm:flex-row items-center gap-6 z-10 relative">
          <Avatar
            src={user.avatarUrl}
            name={user.displayName}
            size="xl"
            status={user.status}
            isHost={user.role === 'admin'}
          />
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold">{user.displayName}</h2>
              {user.role === 'admin' && (
                <Badge variant="accent" size="sm">
                  <Shield className="w-3 h-3 mr-1" /> Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-indigo-200">@{user.nickname || 'user'} • {user.email}</p>
            <p className="text-[11px] text-slate-400">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.gamesPlayed}</p>
          <p className="text-xs font-semibold text-slate-500">Games Played</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.gamesWon}</p>
          <p className="text-xs font-semibold text-slate-500">Games Won</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">{stats.winRate}%</p>
          <p className="text-xs font-semibold text-slate-500">Win Rate</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.currentStreak} 🔥</p>
          <p className="text-xs font-semibold text-slate-500">Current Streak</p>
        </Card>
      </div>

      {/* Profile Settings Form */}
      <Card className="p-6">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-indigo-600" /> Account & Profile Settings
        </h3>

        {savedSuccess && (
          <div className="mb-4 p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Profile successfully updated!
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
          <Input
            label="Display Name"
            value={displayNameInput}
            onChange={(e) => setDisplayNameInput(e.target.value)}
            required
          />
          <Input
            label="Nickname / Handle"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
          />
          <Input
            label="Avatar Image URL"
            value={avatarUrlInput}
            onChange={(e) => setAvatarUrlInput(e.target.value)}
            placeholder="https://..."
          />

          <div className="pt-2">
            <Button variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Achievements Grid */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Achievements & Badges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sampleAchievements.map((ach) => (
            <Card
              key={ach.id}
              className={`p-4 flex items-center gap-4 ${
                !ach.unlocked ? 'opacity-50 grayscale' : ''
              }`}
            >
              <div className="text-3xl p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                {ach.icon}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {ach.title}
                </h4>
                <p className="text-xs text-slate-500">{ach.desc}</p>
                <span className="text-[10px] font-bold mt-1 inline-block text-indigo-600 dark:text-indigo-400">
                  {ach.unlocked ? 'Unlocked ✓' : 'Locked 🔒'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
