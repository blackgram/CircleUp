import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionProps {
  onClick: () => void;
}

export const FloatingAction: React.FC<FloatingActionProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-18 right-5 z-40 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
      aria-label="Create Circle"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
};
