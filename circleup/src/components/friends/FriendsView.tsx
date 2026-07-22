import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Check, X, Users, MessageSquare } from 'lucide-react';
import { useFriendStore } from '../../store/useFriendStore';
import { useRoomStore } from '../../store/useRoomStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

export const FriendsView: React.FC = () => {
  const { friends, fetchFriends, sendFriendRequest, acceptFriendRequest } = useFriendStore();
  const { currentRoom } = useRoomStore();
  const [filterTab, setFilterTab] = useState<'all' | 'online' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [requestSentMsg, setRequestSentMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendInput.trim()) return;
    const ok = await sendFriendRequest(newFriendInput.trim());
    if (ok) {
      setRequestSentMsg(`Friend request sent to ${newFriendInput}`);
      setNewFriendInput('');
      setTimeout(() => setRequestSentMsg(null), 4000);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const matchesSearch =
      f.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.user.nickname && f.user.nickname.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'online') {
      return f.status === 'accepted' && (f.user.status === 'online' || f.user.status === 'in_game');
    }
    if (filterTab === 'pending') {
      return f.status === 'pending_received' || f.status === 'pending_sent';
    }
    return f.status === 'accepted';
  });

  const pendingCount = friends.filter((f) => f.status === 'pending_received').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Friends & Circles</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect with friends, manage requests, and send circle game invites.
          </p>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleSendRequest} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Username or email..."
            value={newFriendInput}
            onChange={(e) => setNewFriendInput(e.target.value)}
            className="w-full sm:w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
            Add Friend
          </Button>
        </form>
      </div>

      {requestSentMsg && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {requestSentMsg}
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Friends ({friends.filter((f) => f.status === 'accepted').length})
          </button>
          <button
            onClick={() => setFilterTab('online')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'online'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Online
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`relative px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Requests
            {pendingCount > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Friends Cards Grid */}
      {filteredFriends.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No friends found"
          description="Try sending a request using a friend's username or email."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((f) => (
            <Card key={f.id} className="p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={f.user.avatarUrl}
                    name={f.user.displayName}
                    size="lg"
                    status={f.user.status}
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {f.user.displayName}
                    </h4>
                    <p className="text-xs text-slate-500">@{f.user.nickname || 'user'}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={f.user.status === 'online' ? 'success' : f.user.status === 'in_game' ? 'secondary' : 'neutral'} size="sm">
                        {f.user.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {f.user.stats.gamesWon} Wins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                {f.status === 'pending_received' ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => acceptFriendRequest(f.id)}
                    >
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<X className="w-3.5 h-3.5" />}>
                      Decline
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={() => alert(`Chatting with ${f.user.displayName}...`)}
                    >
                      Message
                    </Button>
                    {currentRoom && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => alert(`Invited ${f.user.displayName} to circle ${currentRoom.code}!`)}
                      >
                        Invite to Circle
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
