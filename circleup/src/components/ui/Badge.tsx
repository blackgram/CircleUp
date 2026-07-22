import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  const base = 'inline-flex items-center font-medium rounded-full whitespace-nowrap';

  const variants = {
    primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    secondary: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    accent: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return <span className={twMerge(clsx(base, variants[variant], sizes[size], className))}>{children}</span>;
};
