'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Stethoscope,
  User,
  Building2,
  CornerDownLeft,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';

interface DoctorHit {
  id: string;
  name: string;
  specialization: string;
  hospitalAffiliation: string;
  email: string;
  _formatted?: Record<string, string>;
}

interface PatientHit {
  id: string;
  name: string;
  condition: string;
  doctorId: string;
  doctorName?: string;
  contactNumber: string;
  _formatted?: Record<string, string>;
}

interface SearchResponseData {
  doctors: DoctorHit[];
  patients: PatientHit[];
  meta: {
    query: string;
    totalHits: number;
    processingTimeMs: number;
    searchEngine: 'meilisearch' | 'mongo-fallback';
  };
}

type FlattenedItem =
  | { type: 'doctor'; data: DoctorHit }
  | { type: 'patient'; data: PatientHit };

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponseData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Flattened items for single-index keyboard navigation
  const flattenedItems: FlattenedItem[] = [
    ...(results?.doctors || []).map((d) => ({ type: 'doctor' as const, data: d })),
    ...(results?.patients || []).map((p) => ({ type: 'patient' as const, data: p })),
  ];

  const openPalette = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    setIsLoading(false);
  }, []);

  // Open/Close listeners
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) {
            closePalette();
            return false;
          } else {
            openPalette();
            return true;
          }
        });
        return;
      }

      // '/' when not in input / textarea
      if (
        e.key === '/' &&
        !isOpen &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement?.getAttribute('contenteditable') === 'true'
        )
      ) {
        e.preventDefault();
        openPalette();
        return;
      }

      // Escape closes
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closePalette();
      }
    }

    function handleCustomOpen() {
      openPalette();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen, openPalette, closePalette]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Search execution with debounce
  const executeSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient<SearchResponseData>(
        `/search?q=${encodeURIComponent(trimmed)}&limit=6`
      );
      setResults(res.data);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 250);
  };

  const handleSelect = (item: FlattenedItem) => {
    closePalette();
    if (item.type === 'doctor') {
      router.push(`/doctors/${item.data.id}`);
    } else {
      if (item.data.doctorId) {
        router.push(`/doctors/${item.data.doctorId}`);
      } else {
        router.push(`/patients?search=${encodeURIComponent(item.data.name)}`);
      }
    }
  };

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flattenedItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flattenedItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattenedItems.length) % flattenedItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flattenedItems[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  // Helper to render highlighted text safely
  const renderHighlighted = (htmlContent: string | undefined, fallback: string) => {
    if (!htmlContent || !htmlContent.includes('<em>')) {
      return <span>{fallback}</span>;
    }
    // Only allow <em> tags from Meilisearch
    const sanitized = htmlContent.replace(
      /<(?!\/?em>)[^>]+>/g,
      ''
    );
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: sanitized.replace(
            /<em>/g,
            '<span class="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 font-semibold rounded px-0.5">'
          ).replace(/<\/em>/g, '</span>'),
        }}
      />
    );
  };

  if (!isOpen) return null;

  let currentItemIndex = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => closePalette()}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search doctors by name/hospital, or patients by name/condition..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Empty Query State */}
          {!query.trim() && (
            <div className="py-10 px-4 text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quick Navigation & Instant Search
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Type doctor name, hospital, specialization, or patient name to quickly navigate.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  Cardiology
                </span>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  General Hospital
                </span>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  Hypertension
                </span>
              </div>
            </div>
          )}

          {/* Results: No Hits */}
          {query.trim() && !isLoading && flattenedItems.length === 0 && (
            <div className="py-12 px-4 text-center">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with a different spelling or keyword.
              </p>
            </div>
          )}

          {/* Doctors Section */}
          {results && results.doctors.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Doctors ({results.doctors.length})</span>
              </div>
              <div className="space-y-1">
                {results.doctors.map((doc) => {
                  const itemIndex = currentItemIndex++;
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelect({ type: 'doctor', data: doc })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {renderHighlighted(doc._formatted?.name, doc.name)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                            <span>
                              {renderHighlighted(
                                doc._formatted?.specialization,
                                doc.specialization
                              )}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3 shrink-0" />
                              {renderHighlighted(
                                doc._formatted?.hospitalAffiliation,
                                doc.hospitalAffiliation
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                          <span>Open</span>
                          <CornerDownLeft className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Patients Section */}
          {results && results.patients.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Patients ({results.patients.length})</span>
              </div>
              <div className="space-y-1">
                {results.patients.map((pat) => {
                  const itemIndex = currentItemIndex++;
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => handleSelect({ type: 'patient', data: pat })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {renderHighlighted(pat._formatted?.name, pat.name)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3 shrink-0" />
                              {renderHighlighted(
                                pat._formatted?.condition,
                                pat.condition
                              )}
                            </span>
                            {pat.doctorName && (
                              <>
                                <span>•</span>
                                <span>Dr. {pat.doctorName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                          <span>View Doctor</span>
                          <CornerDownLeft className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Navigate with <kbd className="font-mono bg-white dark:bg-slate-700 border px-1 rounded">↑</kbd>{' '}
              <kbd className="font-mono bg-white dark:bg-slate-700 border px-1 rounded">↓</kbd>
            </span>
            <span>•</span>
            <span>
              Select with <kbd className="font-mono bg-white dark:bg-slate-700 border px-1 rounded">↵</kbd>
            </span>
          </div>

          {results?.meta && (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  results.meta.searchEngine === 'meilisearch'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="capitalize">
                {results.meta.searchEngine === 'meilisearch'
                  ? 'Meilisearch'
                  : 'Mongo Fallback'}{' '}
                ({results.meta.processingTimeMs}ms)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
