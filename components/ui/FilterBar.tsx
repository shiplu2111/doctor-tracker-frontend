'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
}

export interface ActiveChip {
  key: string;
  label: string;
  valueLabel: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  activeChips?: ActiveChip[];
  onFilterChange: (key: string, value: string) => void;
  onRemoveChip?: (key: string) => void;
  onClearAll?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  filters,
  activeChips = [],
  onFilterChange,
  onRemoveChip,
  onClearAll,
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center">
            <select
              value={filter.value}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              aria-label={filter.label}
              className="text-xs font-medium py-2 px-3 border border-slate-200 rounded-lg bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            >
              <option value="">{filter.label}: All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {children}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 font-medium mr-1">Active filters:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200"
            >
              <span>
                <span className="text-teal-600 font-normal">{chip.label}:</span> {chip.valueLabel}
              </span>
              {onRemoveChip && (
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip.key)}
                  aria-label={`Remove filter ${chip.label}`}
                  className="hover:text-teal-950 p-0.5 rounded-full hover:bg-teal-100 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
