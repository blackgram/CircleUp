"use client";

import { MostLikelyToGame } from "./MostLikelyToGame";
import { SpectatorGameView } from "./SpectatorGameView";
import type { GameStatePayload, RoomResponse } from "@/types";

interface GameViewProps {
  gameSlug: string;
  room: RoomResponse;
  gameState: GameStatePayload;
  isHost: boolean;
  isSpectator: boolean;
  currentUserId: string;
  onReturnToLobby?: () => void;
}

export function GameView({ gameSlug, room, gameState, isHost, isSpectator, currentUserId, onReturnToLobby }: GameViewProps) {
  if (isSpectator) {
    return (
      <SpectatorGameView
        room={room}
        gameState={gameState}
        onReturnToLobby={onReturnToLobby}
      />
    );
  }

  switch (gameSlug) {
    case "most-likely-to":
    case "m-l-t":
      return (
        <MostLikelyToGame
          room={room}
          gameState={gameState}
          isHost={isHost}
          currentUserId={currentUserId}
          onReturnToLobby={onReturnToLobby}
        />
      );
    default:
      return (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
          <p className="text-sm font-bold text-slate-700">Game "{gameSlug}" is not yet supported on this client.</p>
          <p className="text-xs text-slate-500 mt-1">Waiting for game updates...</p>
        </div>
      );
  }
}
