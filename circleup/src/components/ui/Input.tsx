import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500',
                leftIcon ? 'pl-10' : 'pl-3.5',
                rightIcon ? 'pr-10' : 'pr-3.5',
                error && 'border-rose-500 focus:ring-rose-500',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400">{rightIcon}</div>
          )}
        </div>
        {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
