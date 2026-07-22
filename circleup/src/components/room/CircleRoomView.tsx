import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Copy,
  Check,
  UserPlus,
  Play,
  Settings,
  Bot,
  Crown,
  UserX,
  Send,
  MessageSquare,
  Sparkles,
  Gamepad2,
  Users,
  Sliders,
  LogOut,
} from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useFriendStore } from '../../store/useFriendStore';
import { GameInfo } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface CircleRoomViewProps {
  games: GameInfo[];
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const CircleRoomView: React.FC<CircleRoomViewProps> = ({
  games,
  onStartGame,
  onLeaveRoom,
}) => {
  const { currentRoom, toggleReady, updateSettings, sendChatMessage, addBotPlayer, kickPlayer, transferHost } = useRoomStore();
  const { user } = useAuthStore();
  const { friends } = useFriendStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (!currentRoom || !user) return null;

  const isHost = currentRoom.hostId === user.id;
  const myPlayer = currentRoom.players.find((p) => p.userId === user.id);
  const currentGame = games.find((g) => g.id === currentRoom.gameId) || games[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(user, chatInput);
    setChatInput('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Room Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl shadow-indigo-600/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
              Private Circle Lobby
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">{currentRoom.name}</h2>
          <p className="text-xs text-indigo-100">
            Selected Game: <strong className="text-white">{currentGame?.name}</strong> • Host:{' '}
            <strong className="text-white">
              {currentRoom.players.find((p) => p.isHost)?.displayName || 'Host'}
            </strong>
          </p>
        </div>

        {/* Code & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-200">Room Code</p>
              <p className="text-lg font-mono font-extrabold tracking-widest">{currentRoom.code}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <Button
            variant="ghost"
            size="md"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={onLeaveRoom}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Players & Settings, Right Chat & Invites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player Grid & Host Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Selection & Settings bar */}
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Current Game</p>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {currentGame?.name}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isHost && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Settings className="w-3.5 h-3.5" />}
                    onClick={() => setShowSettingsModal(true)}
                  >
                    Room Settings
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Bot className="w-3.5 h-3.5" />}
                    onClick={addBotPlayer}
                  >
                    + Add AI Bot
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Player Cards List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Players in Circle ({currentRoom.players.length}/{currentRoom.maxPlayers})
              </h3>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setShowInviteModal(true)}
              >
                Invite Friends
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRoom.players.map((player) => (
                <div
                  key={player.userId}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    player.isReady
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Avatar
                      src={player.avatarUrl}
                      name={player.displayName}
                      size="md"
                      status={player.connectionStatus}
                      isHost={player.isHost}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {player.displayName}
                        </p>
                        {player.userId === user.id && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            (You)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {player.isReady ? 'Ready to play' : 'Not Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {player.userId === user.id ? (
                      <Button
                        variant={myPlayer?.isReady ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => toggleReady(user.id, !myPlayer?.isReady)}
                      >
                        {myPlayer?.isReady ? 'Ready ✓' : 'Set Ready'}
                      </Button>
                    ) : (
                      isHost && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => transferHost(player.userId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950"
                            title="Make Host"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => kickPlayer(player.userId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                            title="Kick Player"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Start Game Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                {isHost
                  ? 'As host, click Start Game when everyone is ready.'
                  : 'Waiting for host to launch the game match...'}
              </p>

              {isHost ? (
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Play className="w-5 h-5 fill-current" />}
                  onClick={onStartGame}
                  className="w-full sm:w-auto shadow-lg shadow-indigo-600/30"
                >
                  Start Game Match
                </Button>
              ) : (
                <Button
                  variant={myPlayer?.isReady ? 'primary' : 'outline'}
                  size="lg"
                  onClick={() => toggleReady(user.id, !myPlayer?.isReady)}
                >
                  {myPlayer?.isReady ? 'You Are Ready ✓' : 'I Am Ready'}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Room Chat */}
        <Card className="p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> Circle Chat
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">Real-time</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {currentRoom.chatMessages.map((msg) => (
              <div key={msg.id} className="text-xs">
                {msg.type === 'system' ? (
                  <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 text-center font-semibold text-indigo-700 dark:text-indigo-300 text-[11px]">
                    ✨ {msg.content}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Avatar src={msg.senderAvatar} name={msg.senderName} size="xs" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message to circle..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </Card>
      </div>

      {/* Room Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Room & Game Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Game
            </label>
            <select
              value={currentRoom.gameId}
              onChange={(e) => updateSettings({}, e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.minPlayers}-{g.maxPlayers} Players)
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic settingsSchema Controls */}
          {currentGame?.settingsSchema.map((schema) => (
            <div key={schema.key}>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {schema.label} ({currentRoom.settings[schema.key] ?? schema.default})
              </label>
              {schema.type === 'range' && (
                <input
                  type="range"
                  min={schema.min}
                  max={schema.max}
                  step={schema.step}
                  value={currentRoom.settings[schema.key] ?? schema.default}
                  onChange={(e) =>
                    updateSettings({ [schema.key]: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
              )}
              {schema.type === 'select' && (
                <select
                  value={currentRoom.settings[schema.key] ?? schema.default}
                  onChange={(e) =>
                    updateSettings({ [schema.key]: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2 border border-slate-200 dark:border-slate-700"
                >
                  {schema.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowSettingsModal(false)}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Friends Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Online Friends to Circle"
      >
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {friends.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No friends added yet.</p>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <Avatar src={f.user.avatarUrl} name={f.user.displayName} size="sm" status={f.user.status} />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{f.user.displayName}</p>
                    <p className="text-[10px] text-slate-500">@{f.user.nickname || 'user'}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert(`Invitation sent to ${f.user.displayName}!`);
                  }}
                >
                  Send Invite
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
