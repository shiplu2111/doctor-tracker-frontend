'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isError = false,
  error = 'Failed to load data',
  onRetry,
  sortBy,
  sortOrder = 'desc',
  onSort,
  emptyState,
  className,
}: DataTableProps<T>) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-900 mb-1">Error Loading Data</h4>
        <p className="text-sm text-slate-500 max-w-sm mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-hidden bg-white rounded-xl border border-slate-200 shadow-xs', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              {columns.map((col) => {
                const isCurrentSort = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3.5 text-xs font-semibold text-slate-600 select-none whitespace-nowrap',
                      col.headerClassName,
                    )}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 group hover:text-slate-900 transition-colors"
                      >
                        <span>{col.header}</span>
                        <span className="text-slate-400 group-hover:text-slate-700">
                          {isCurrentSort ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-teal-600" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-teal-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                          )}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="px-4 py-4">
                      <div
                        className="h-4 bg-slate-200 rounded"
                        style={{ width: `${Math.max(40, 75 - (cIdx * 10))}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  {emptyState || (
                    <div className="text-center py-6">
                      <p className="text-sm font-medium text-slate-700">No records found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/75 transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5 text-slate-700 whitespace-nowrap', col.className)}
                    >
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
