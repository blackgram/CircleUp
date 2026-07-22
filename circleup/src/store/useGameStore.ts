import { create } from 'zustand';
import { GameState } from '../types';
import { getSocket } from '../lib/socket';
import confetti from 'canvas-confetti';

interface GameStoreState {
  gameState: GameState | null;
  selectedOptionId: string | null;
  textAnswerInput: string;
  isSubmitting: boolean;
  hasFiredConfetti: boolean;

  initGameListeners: () => void;
  setSelectedOptionId: (id: string | null) => void;
  setTextAnswerInput: (text: string) => void;
  submitAnswer: (roomCode: string, userId: string, answer: any, timeTaken?: number) => void;
  resetGame: (roomCode: string) => void;
  triggerWinnerConfetti: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  selectedOptionId: null,
  textAnswerInput: '',
  isSubmitting: false,
  hasFiredConfetti: false,

  initGameListeners: () => {
    const socket = getSocket();

    socket.off('game:update');
    socket.on('game:update', (updatedState: GameState) => {
      const prevPhase = get().gameState?.phase;
      set({ gameState: updatedState });

      // Reset selection when phase changes to question
      if (updatedState.phase === 'question' && prevPhase !== 'question') {
        set({ selectedOptionId: null, textAnswerInput: '', isSubmitting: false, hasFiredConfetti: false });
      }

      // Fire confetti when game ends and winner is revealed
      if (updatedState.phase === 'game_over' && updatedState.winner && !get().hasFiredConfetti) {
        get().triggerWinnerConfetti();
        set({ hasFiredConfetti: true });
      }
    });
  },

  setSelectedOptionId: (id) => set({ selectedOptionId: id }),
  setTextAnswerInput: (text) => set({ textAnswerInput: text }),

  submitAnswer: (roomCode, userId, answer, timeTaken = 5) => {
    set({ isSubmitting: true });
    const socket = getSocket();
    socket.emit('game:submit_answer', { code: roomCode, userId, answer, timeTaken });
  },

  resetGame: (roomCode) => {
    const socket = getSocket();
    socket.emit('game:reset', { code: roomCode });
    set({ gameState: null, selectedOptionId: null, textAnswerInput: '', isSubmitting: false, hasFiredConfetti: false });
  },

  triggerWinnerConfetti: () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F43F5E'],
      });
    } catch {
      // Ignored if canvas context is unavailable
    }
  },
}));
