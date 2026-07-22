import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Radio, UserPlus, Trophy, Info } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

interface NotificationsViewProps {
  setActiveTab: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ setActiveTab }) => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const { joinRoom } = useRoomStore();
  const { user } = useAuthStore();
  const [filterType, setFilterType] = useState<'all' | 'invite' | 'friend_request' | 'system'>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'invite':
        return <Radio className="w-4 h-4 text-indigo-500" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Notifications & Alerts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time invites, friend requests, and achievement logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            onClick={markAllAsRead}
          >
            Mark All Read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={clearAll}
            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['all', 'invite', 'friend_request', 'system'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filterType === type
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="No notifications"
          description="You are all caught up! Invites and friend activity will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                !n.read
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                    Mark Read
                  </Button>
                )}
                {n.data?.roomCode && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      markAsRead(n.id);
                      if (user) {
                        const ok = await joinRoom(n.data!.roomCode!, user);
                        if (ok) setActiveTab('circle');
                      }
                    }}
                  >
                    Join Room ({n.data.roomCode})
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
