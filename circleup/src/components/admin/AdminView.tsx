import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Gamepad2,
  Radio,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { GameInfo, PlatformAnalytics, Room, User } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface AdminViewProps {
  games: GameInfo[];
  onRefreshGames: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ games, onRefreshGames }) => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);

  // New Game Form state
  const [newGameName, setNewGameName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameCategory, setNewGameCategory] = useState('Knowledge');

  useEffect(() => {
    api.admin.analytics().then(setAnalytics).catch(console.error);
    api.rooms.listActive().then(setActiveRooms).catch(console.error);
    api.admin.users().then(setUsersList).catch(console.error);
  }, []);

  const handleToggleGame = async (gameId: string, currentEnabled: boolean) => {
    await api.games.update(gameId, { enabled: !currentEnabled });
    onRefreshGames();
  };

  const handleCreateGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    await api.games.create({
      name: newGameName.trim(),
      description: newGameDesc.trim() || 'Custom party game created by admin',
      category: newGameCategory,
      minPlayers: 2,
      maxPlayers: 12,
      estimatedTimeMinutes: 10,
      difficulty: 'Medium',
      defaultSettings: { rounds: 5, timePerQuestion: 15 },
      settingsSchema: [
        { key: 'rounds', label: 'Rounds', type: 'range', default: 5, min: 3, max: 10, step: 1 },
        { key: 'timePerQuestion', label: 'Timer (s)', type: 'range', default: 15, min: 10, max: 30, step: 5 },
      ],
      questionSchema: [
        { key: 'prompt', label: 'Prompt', type: 'text', required: true },
        { key: 'options', label: 'Options', type: 'options', required: true },
      ],
    });

    setShowCreateGameModal(false);
    setNewGameName('');
    setNewGameDesc('');
    onRefreshGames();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> Platform Admin Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Platform analytics, game schema management, active room monitoring, and user management.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateGameModal(true)}
        >
          Create New Game
        </Button>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Active Circles</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.activeCirclesCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Online Users</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.onlineUsersCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Matches Today</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.gamesPlayedToday}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Most Popular</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {analytics.popularGameName}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Game Management Section */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Game Catalog & Schema Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((g) => (
            <Card key={g.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</h4>
                  <Badge variant={g.enabled ? 'success' : 'neutral'} size="sm">
                    {g.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{g.description}</p>
                <span className="text-[10px] text-indigo-600 font-mono mt-1 inline-block">
                  {g.settingsSchema.length} settings fields • {g.questionSchema.length} question fields
                </span>
              </div>

              <Button
                variant={g.enabled ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleToggleGame(g.id, g.enabled)}
              >
                {g.enabled ? 'Disable' : 'Enable'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Circles Live Monitor */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Active Circle Rooms Monitor
        </h3>
        <Card className="p-4">
          {activeRooms.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No active rooms currently.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeRooms.map((r) => (
                <div key={r.code} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                        {r.code}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</h5>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.players.length}/{r.maxPlayers} players • Status: {r.status}
                    </p>
                  </div>
                  <Badge variant={r.status === 'playing' ? 'secondary' : 'primary'}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* User Management */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Registered Users
        </h3>
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="pb-2">User</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Games Played</th>
                <th className="pb-2">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map((u) => (
                <tr key={u.id} className="py-2">
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">{u.displayName}</td>
                  <td className="py-2.5 text-slate-500">{u.email}</td>
                  <td className="py-2.5">
                    <Badge variant={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role}</Badge>
                  </td>
                  <td className="py-2.5 font-bold">{u.stats?.gamesPlayed || 0}</td>
                  <td className="py-2.5 font-bold">{u.stats?.winRate || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Create Custom Game Modal */}
      <Modal
        isOpen={showCreateGameModal}
        onClose={() => setShowCreateGameModal(false)}
        title="Create Custom Party Game"
      >
        <form onSubmit={handleCreateGameSubmit} className="space-y-4">
          <Input
            label="Game Name"
            placeholder="e.g. Emoji Charades"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
            required
          />
          <Input
            label="Description"
            placeholder="Game rules and description..."
            value={newGameDesc}
            onChange={(e) => setNewGameDesc(e.target.value)}
          />
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Category
            </label>
            <select
              value={newGameCategory}
              onChange={(e) => setNewGameCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700"
            >
              <option value="Knowledge">Knowledge</option>
              <option value="Social">Social</option>
              <option value="Word & Puzzle">Word & Puzzle</option>
              <option value="Reaction">Reaction</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateGameModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              Save & Publish Game
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
