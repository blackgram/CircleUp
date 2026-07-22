import React, { useState } from 'react';
import { GameInfo, User } from '../../types';
import { useRoomStore } from '../../store/useRoomStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Sparkles } from 'lucide-react';

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: GameInfo[];
  user: User | null;
  onSuccess: (roomCode: string) => void;
}

export const CreateCircleModal: React.FC<CreateCircleModalProps> = ({
  isOpen,
  onClose,
  games,
  user,
  onSuccess,
}) => {
  const { createRoom, isLoading } = useRoomStore();

  const [roomName, setRoomName] = useState(`${user?.displayName || 'Player'}'s Circle`);
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id || 'game_trivia');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const roomCode = await createRoom(
      roomName.trim() || `${user.displayName}'s Circle`,
      selectedGameId,
      user,
      maxPlayers,
      isPrivate
    );

    if (roomCode) {
      onClose();
      onSuccess(roomCode);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Create Private Circle Room</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Circle / Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
        />

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Party Game
          </label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.minPlayers}-{g.maxPlayers} players)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Max Players ({maxPlayers})
          </label>
          <input
            type="range"
            min={2}
            max={16}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Private Room</p>
            <p className="text-[11px] text-slate-500">Only friends with room code can join</p>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="md" isLoading={isLoading} type="submit">
            Create & Enter Room
          </Button>
        </div>
      </form>
    </Modal>
  );
};
