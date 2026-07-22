import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'in_game' | 'idle' | 'offline';
  isHost?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Player',
  size = 'md',
  status,
  isHost,
  className,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    in_game: 'bg-violet-500',
    idle: 'bg-amber-500',
    offline: 'bg-slate-400',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={twMerge('relative inline-flex items-center justify-center shrink-0', className)}>
      <div
        className={clsx(
          'relative rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-900 font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-sm',
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900',
            statusColors[status],
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3.5 h-3.5'
          )}
          title={`Status: ${status}`}
        />
      )}

      {isHost && (
        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-extrabold text-[10px] px-1 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm" title="Circle Host">
          👑
        </span>
      )}
    </div>
  );
};
