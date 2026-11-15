'use client';

import React from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  className?: string;
}

export function DateRangePicker({ from = '', to = '', onChange, className }: DateRangePickerProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ from: e.target.value || undefined, to: to || undefined });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ from: from || undefined, to: e.target.value || undefined });
  };

  const handleClear = () => {
    onChange({ from: undefined, to: undefined });
  };

  const hasRange = Boolean(from || to);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 p-1 border border-slate-200 rounded-lg bg-white text-xs',
        className,
      )}
    >
      <div className="flex items-center gap-1 pl-2 text-slate-400">
        <Calendar className="h-3.5 w-3.5" />
      </div>

      <div className="flex items-center gap-1">
        <input
          type="date"
          value={from}
          onChange={handleFromChange}
          aria-label="Filter from date"
          className="py-1 px-1.5 text-xs text-slate-700 bg-transparent rounded border border-transparent hover:border-slate-200 focus:outline-none focus:border-teal-500"
        />
        <span className="text-slate-400 font-medium">to</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={handleToChange}
          aria-label="Filter to date"
          className="py-1 px-1.5 text-xs text-slate-700 bg-transparent rounded border border-transparent hover:border-slate-200 focus:outline-none focus:border-teal-500"
        />
      </div>

      {hasRange && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear date range"
          className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors mr-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
