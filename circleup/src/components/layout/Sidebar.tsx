import React, { useState } from 'react';
import {
  Home,
  Users,
  Gamepad2,
  Bell,
  User as UserIcon,
  ShieldCheck,
  PlusCircle,
  LogIn,
  LogOut,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useRoomStore } from '../../store/useRoomStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { currentRoom } = useRoomStore();
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const { joinRoom } = useRoomStore();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'games', label: 'Games Catalog', icon: Gamepad2 },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    ...(user?.role === 'admin'
      ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldCheck }]
      : []),
  ];

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCodeInput.trim() || !user) return;
    const ok = await joinRoom(quickCodeInput.trim(), user);
    if (ok) {
      setActiveTab('circle');
      setQuickCodeInput('');
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 p-5 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Circle<span className="text-indigo-600 dark:text-indigo-400">Up</span>
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              by AJ
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Gather. Play. Connect.
          </p>
        </div>
      </div>

      {/* Active Room Indicator */}
      {currentRoom && (
        <div
          onClick={() => setActiveTab('circle')}
          className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white cursor-pointer shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="truncate">
              <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
                Active Circle
              </p>
              <p className="text-sm font-extrabold truncate">{currentRoom.name}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white/20 px-2 py-1 rounded-lg shrink-0">
            {currentRoom.code}
          </span>
        </div>
      )}

      {/* Quick Actions */}
      {isAuthenticated && (
        <div className="flex flex-col gap-2 mb-6">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={onOpenCreateModal}
            className="w-full justify-center"
          >
            Create Circle
          </Button>

          {/* Quick Join Input */}
          <form onSubmit={handleQuickJoin} className="relative mt-1">
            <input
              type="text"
              placeholder="Enter Room Code (e.g. CIR-789)"
              value={quickCodeInput}
              onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
              className="w-full bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-3 py-2.5 pr-14 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!quickCodeInput.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[11px] font-bold px-2.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Radio className="w-3 h-3" /> Join
            </button>
          </form>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div
              className="flex items-center gap-2.5 cursor-pointer truncate"
              onClick={() => setActiveTab('profile')}
            >
              <Avatar
                src={user.avatarUrl}
                name={user.displayName}
                size="md"
                status={user.status}
              />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  @{user.nickname || 'user'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            leftIcon={<LogIn className="w-4 h-4" />}
            onClick={onOpenAuthModal}
            className="w-full justify-center"
          >
            Sign In / Register
          </Button>
        )}
      </div>
    </aside>
  );
};
