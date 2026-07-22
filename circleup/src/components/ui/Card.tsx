import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  glass = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-200 overflow-hidden',
          hoverEffect && 'hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/60',
          glass && 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
