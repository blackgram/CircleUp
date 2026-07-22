import React, { useState } from 'react';
import {
  Bell,
  Search,
  Sparkles,
  PlusCircle,
  Radio,
  WifiOff,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useRoomStore } from '../../store/useRoomStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  setActiveTab,
  onOpenCreateModal,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount, notifications, markAsRead } = useNotificationStore();
  const { currentRoom, isReconnecting, joinRoom } = useRoomStore();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [topCodeInput, setTopCodeInput] = useState('');

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topCodeInput.trim() || !user) return;
    const ok = await joinRoom(topCodeInput.trim(), user);
    if (ok) {
      setActiveTab('circle');
      setTopCodeInput('');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      {/* Reconnecting Banner */}
      {isReconnecting && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-4 -mx-4 -mt-3 mb-3 flex items-center justify-center gap-2 animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>Reconnecting to CircleUp real-time servers...</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Mobile / Tablet Brand Header */}
        <div className="flex items-center gap-2.5 lg:hidden cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              Circle<span className="text-indigo-600">Up</span>
            </h1>
          </div>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden sm:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search friends, games, or rooms..."
            className="w-full bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Quick Room Code join input (Tablet) */}
          {isAuthenticated && (
            <form onSubmit={handleQuickJoin} className="hidden sm:flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Code"
                value={topCodeInput}
                onChange={(e) => setTopCodeInput(e.target.value.toUpperCase())}
                className="w-24 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700"
              />
              <Button type="submit" variant="primary" size="sm" leftIcon={<Radio className="w-3 h-3" />}>
                Join
              </Button>
            </form>
          )}

          {/* Create Circle button */}
          {isAuthenticated && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={onOpenCreateModal}
              className="hidden sm:inline-flex"
            >
              New Circle
            </Button>
          )}

          {/* Active Room Chip (Mobile/Tablet) */}
          {currentRoom && (
            <button
              onClick={() => setActiveTab('circle')}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentRoom.code}</span>
            </button>
          )}

          {/* Notifications Dropdown Toggle */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Notifications
                    </h4>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        setActiveTab('notifications');
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        No notifications yet!
                      </p>
                    ) : (
                      notifications.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.data?.roomCode) {
                              joinRoom(n.data.roomCode, user!);
                              setActiveTab('circle');
                              setShowNotifMenu(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-colors cursor-pointer text-xs ${
                            !n.read
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900'
                              : 'bg-slate-50 dark:bg-slate-800/40'
                          }`}
                        >
                          <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Avatar or Login */}
          {isAuthenticated && user ? (
            <div
              className="cursor-pointer"
              onClick={() => setActiveTab('profile')}
              title={user.displayName}
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="sm" status={user.status} />
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={onOpenAuthModal}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
