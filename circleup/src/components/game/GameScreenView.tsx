import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Zap,
  RotateCcw,
  Sparkles,
  Flame,
  Check,
  Send,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoomStore } from '../../store/useRoomStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

export const GameScreenView: React.FC = () => {
  const { gameState, selectedOptionId, setSelectedOptionId, textAnswerInput, setTextAnswerInput, submitAnswer, resetGame, isSubmitting } = useGameStore();
  const { user } = useAuthStore();
  const { currentRoom } = useRoomStore();

  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    setStartTime(Date.now());
  }, [gameState?.currentQuestion?.id]);

  if (!gameState || !user) return null;

  const isHost = currentRoom?.hostId === user.id;
  const currentQuestion = gameState.currentQuestion;
  const myAnswer = gameState.playerAnswers[user.id];

  const handleOptionSelect = (optionId: string) => {
    if (myAnswer || isSubmitting) return;
    setSelectedOptionId(optionId);
    const timeTaken = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    submitAnswer(gameState.roomId, user.id, optionId, timeTaken);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textAnswerInput.trim() || myAnswer || isSubmitting) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    submitAnswer(gameState.roomId, user.id, textAnswerInput.trim(), timeTaken);
  };

  const timerPercent =
    gameState.phaseTotalTime > 0
      ? (gameState.phaseTimeRemaining / gameState.phaseTotalTime) * 100
      : 0;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Game Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
              Round {gameState.currentRound} of {gameState.totalRounds}
            </p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
              Phase: {gameState.phase.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Live Timer Clock */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-extrabold text-sm text-slate-900 dark:text-white">
          <Timer className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>{gameState.phaseTimeRemaining}s</span>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full transition-all duration-300 ${
            gameState.phaseTimeRemaining <= 3 ? 'bg-rose-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* PHASE 1: COUNTDOWN */}
      {gameState.phase === 'countdown' && (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <motion.div
            key={gameState.phaseTimeRemaining}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-7xl font-extrabold text-indigo-600 dark:text-indigo-400 my-4"
          >
            {gameState.phaseTimeRemaining > 0 ? gameState.phaseTimeRemaining : 'GO!'}
          </motion.div>
          <p className="text-sm font-bold text-slate-500">Get Ready for Round {gameState.currentRound}!</p>
        </Card>
      )}

      {/* PHASE 2: QUESTION / ANSWERING */}
      {gameState.phase === 'question' && currentQuestion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Question Prompt Card */}
            <Card className="p-6 sm:p-8 border-indigo-200 dark:border-indigo-900 shadow-md">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">
                Prompt
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {currentQuestion.prompt}
              </h2>

              {/* Code Snippet if applicable */}
              {currentQuestion.codeSnippet && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800">
                  <pre>{currentQuestion.codeSnippet}</pre>
                </div>
              )}
            </Card>

            {/* Render Multiple Choice Options */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionId === option.id || myAnswer?.answer === option.id;
                  const optionLetters = ['A', 'B', 'C', 'D'];

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={Boolean(myAnswer)}
                      className={`p-5 rounded-2xl border-2 text-left font-bold text-sm transition-all duration-200 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-extrabold text-xs ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600'}`}>
                          {optionLetters[idx % 4]}
                        </span>
                        <span>{option.text}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text Guess Input if applicable */}
            {currentQuestion.type === 'text_guess' && (
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your answer puzzle guess here..."
                  value={textAnswerInput}
                  onChange={(e) => setTextAnswerInput(e.target.value)}
                  disabled={Boolean(myAnswer)}
                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
                <Button type="submit" variant="primary" size="lg" disabled={Boolean(myAnswer)}>
                  <Send className="w-4 h-4 mr-1" /> Submit Answer
                </Button>
              </form>
            )}

            {myAnswer && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Answer locked in! Waiting for other players...
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* PHASE 3: REVEAL / ROUND SUMMARY */}
      {gameState.phase === 'reveal' && (
        <Card className="p-6 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-extrabold uppercase text-indigo-600 tracking-wider">
              Round {gameState.currentRound} Reveal
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {myAnswer?.isCorrect ? '🎉 Correct Answer!' : 'Nice Effort!'}
            </h3>
            {gameState.roundResult?.explanation && (
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                {gameState.roundResult.explanation}
              </p>
            )}
          </div>

          {/* Breakdown Votes / Answers */}
          {gameState.roundResult?.breakdown && (
            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-xs font-bold text-slate-400">Answer Breakdown</p>
              {Object.entries(gameState.roundResult.breakdown).map(([ansKey, count]) => (
                <div key={ansKey} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">{ansKey}</span>
                  <span className="font-mono font-extrabold text-indigo-600">{count} votes</span>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard Table */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Live Leaderboard
            </h4>
            <div className="space-y-2">
              {gameState.leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    entry.rank === 1
                      ? 'bg-amber-500/10 border-amber-400/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-sm w-6 text-center text-slate-400">
                      #{entry.rank}
                    </span>
                    <Avatar src={entry.avatarUrl} name={entry.displayName} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{entry.displayName}</p>
                      {entry.lastScoreChange > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          +{entry.lastScoreChange} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    {entry.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* PHASE 4: GAME OVER */}
      {gameState.phase === 'game_over' && (
        <Card className="p-8 text-center space-y-6">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase text-indigo-600 tracking-widest">
              Match Complete
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Winner: {gameState.winner?.displayName || 'Circle Champions'}! 🎉
            </h2>
            <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              Winning Score: {gameState.winner?.score} pts
            </p>
          </div>

          {/* Final Standings */}
          <div className="max-w-md mx-auto space-y-2 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase">Final Standings</p>
            {gameState.leaderboard.map((player) => (
              <div key={player.userId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-xs">#{player.rank}</span>
                  <Avatar src={player.avatarUrl} name={player.displayName} size="xs" />
                  <span className="text-xs font-bold">{player.displayName}</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600">{player.score} pts</span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            {isHost && (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => resetGame(gameState.roomId)}
              >
                Play Again / Return to Lobby
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
