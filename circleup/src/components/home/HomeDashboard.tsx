import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  PlusCircle,
  Radio,
  Trophy,
  Flame,
  Zap,
  Gamepad2,
  Users,
  ArrowRight,
  Play,
  Heart,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useFriendStore } from '../../store/useFriendStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { GameInfo } from '../../types';

interface HomeDashboardProps {
  games: GameInfo[];
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  games,
  setActiveTab,
  onOpenCreateModal,
}) => {
  const { user } = useAuthStore();
  const { friends } = useFriendStore();
  const { currentRoom, joinRoom } = useRoomStore();

  const [joinCodeInput, setJoinCodeInput] = React.useState('');

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !user) return;
    const ok = await joinRoom(joinCodeInput.trim(), user);
    if (ok) {
      setActiveTab('circle');
    }
  };

  const onlineFriends = friends.filter((f) => f.user.status === 'online' || f.user.status === 'in_game');
  const stats = user?.stats || {
    gamesPlayed: 42,
    gamesWon: 27,
    winRate: 64,
    currentStreak: 5,
    favoriteGame: 'Trivia Master',
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & Quick Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/20"
      >
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-indigo-100 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Multiplayer Social Party Gaming</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready for game night, {user?.displayName || 'Player'}?
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Create a private circle room, invite your friends with a code, and jump into fast, schema-driven party games in real time!
            </p>
          </div>

          {/* Quick Action Box */}
          <div className="w-full lg:w-auto bg-white/10 dark:bg-slate-900/30 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="accent"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={onOpenCreateModal}
              className="w-full sm:w-auto"
            >
              Create Circle
            </Button>

            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Room Code (CIR-789)"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-full sm:w-36 bg-white/20 text-white placeholder-indigo-200 text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                disabled={!joinCodeInput.trim()}
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs px-3 py-2.5 rounded-xl disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
              >
                <Radio className="w-3.5 h-3.5" /> Join
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Active Room Resume Banner */}
      {currentRoom && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            <div>
              <p className="text-xs font-bold uppercase text-emerald-100">Circle In Progress</p>
              <p className="text-base font-extrabold">{currentRoom.name} ({currentRoom.code})</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('circle')}
            className="bg-white/20 hover:bg-white/30 text-white font-bold"
          >
            Rejoin Circle
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Player Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4 flex flex-col justify-between">
            <div className="p-2.5 w-fit rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-2">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Played</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.gamesPlayed}</p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Games Won</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.gamesWon}</p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <div className="p-2.5 w-fit rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Win Rate</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.winRate}%</p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <div className="p-2.5 w-fit rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mb-2">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Streak</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.currentStreak} 🔥</p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="p-2.5 w-fit rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 mb-2">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Favorite</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{stats.favoriteGame}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Popular Games Catalog Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-600" /> Popular Party Games
          </h3>
          <button
            onClick={() => setActiveTab('games')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View All Games <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <Card key={game.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${game.bannerGradient || 'from-indigo-600 to-violet-600'} text-white flex items-center justify-center font-bold text-xl shadow-md mb-3`}>
                  🎯
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">{game.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{game.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {game.minPlayers}-{game.maxPlayers} Players • ~{game.estimatedTimeMinutes}m
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play className="w-3 h-3" />}
                  onClick={() => {
                    onOpenCreateModal();
                  }}
                >
                  Play
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Online Friends Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Friends Online ({onlineFriends.length})
          </h3>
          <button
            onClick={() => setActiveTab('friends')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage Friends
          </button>
        </div>

        <Card className="p-4">
          {onlineFriends.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No friends currently online.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {onlineFriends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={f.user.avatarUrl} name={f.user.displayName} size="sm" status={f.user.status} />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{f.user.displayName}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{f.user.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentRoom) {
                        // Invite logic
                      } else {
                        onOpenCreateModal();
                      }
                    }}
                  >
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
