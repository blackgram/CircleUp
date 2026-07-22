import React, { useState } from 'react';
import { Gamepad2, Play, Sliders, Layers, Sparkles, Code, CheckCircle2 } from 'lucide-react';
import { GameInfo } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface GamesCatalogViewProps {
  games: GameInfo[];
  onSelectGameToPlay: (game: GameInfo) => void;
}

export const GamesCatalogView: React.FC<GamesCatalogViewProps> = ({
  games,
  onSelectGameToPlay,
}) => {
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<GameInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Knowledge', 'Social', 'Word & Puzzle', 'Reaction'];

  const filteredGames = games.filter((g) => {
    if (!g.enabled) return false;
    if (selectedCategory !== 'All' && g.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-indigo-600" /> Games Catalog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schema-driven party games for any size group. Only enabled games are playable.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <Card key={game.id} hoverEffect className="p-6 flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                    game.bannerGradient || 'from-indigo-600 to-violet-600'
                  } text-white flex items-center justify-center font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform`}
                >
                  🎯
                </div>
                <Badge variant="primary" size="md">
                  {game.category}
                </Badge>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1.5">
                {game.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {game.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  👥 {game.minPlayers}-{game.maxPlayers} Players
                </span>
                <span>⏱️ ~{game.estimatedTimeMinutes} mins</span>
                <span>⚡ {game.difficulty}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Sliders className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedGameForDetails(game)}
                  className="flex-1"
                >
                  Schema Info
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => onSelectGameToPlay(game)}
                  className="flex-1"
                >
                  Start Room
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Game Details / Schema Inspector Modal */}
      {selectedGameForDetails && (
        <Modal
          isOpen={Boolean(selectedGameForDetails)}
          onClose={() => setSelectedGameForDetails(null)}
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>{selectedGameForDetails.name} Schema Inspector</span>
            </div>
          }
          maxWidth="lg"
        >
          <div className="space-y-6 text-slate-900 dark:text-white">
            <div>
              <p className="text-xs text-slate-500 mb-2">{selectedGameForDetails.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedGameForDetails.category}</Badge>
                <Badge variant="neutral">{selectedGameForDetails.difficulty} Difficulty</Badge>
              </div>
            </div>

            {/* settingsSchema section */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" /> Dynamic settingsSchema
              </h4>
              <div className="space-y-2.5">
                {selectedGameForDetails.settingsSchema.map((field) => (
                  <div key={field.key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{field.label} ({field.key})</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {field.type}
                      </span>
                    </div>
                    {field.description && <p className="text-[11px] text-slate-500 mb-1">{field.description}</p>}
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      Default: {JSON.stringify(field.default)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* questionSchema section */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-500" /> Dynamic questionSchema
              </h4>
              <div className="space-y-2">
                {selectedGameForDetails.questionSchema.map((q) => (
                  <div key={q.key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold">{q.label} ({q.key})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{q.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => {
                  const game = selectedGameForDetails;
                  setSelectedGameForDetails(null);
                  onSelectGameToPlay(game);
                }}
              >
                Create Circle with this Game
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
