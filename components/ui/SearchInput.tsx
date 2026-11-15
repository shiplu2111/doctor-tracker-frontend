'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  onDebounce?: (val: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onDebounce,
  debounceMs = 300,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(controlledValue ?? defaultValue ?? '');

  const onDebounceRef = useRef(onDebounce);

  useEffect(() => {
    onDebounceRef.current = onDebounce;
  }, [onDebounce]);

  const isUserAction = useRef(false);

  // Sync external changes (e.g. filter chips cleared or query param reset from outside)
  const externalProp = controlledValue ?? defaultValue;
  const prevExternalPropRef = useRef(externalProp);

  useEffect(() => {
    if (externalProp !== prevExternalPropRef.current) {
      prevExternalPropRef.current = externalProp;
      setInternalValue(externalProp ?? '');
    }
  }, [externalProp]);

  // Debounce user keystrokes only
  useEffect(() => {
    if (!isUserAction.current) return;
    isUserAction.current = false;
    if (!onDebounceRef.current) return;

    const timer = setTimeout(() => {
      onDebounceRef.current?.(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    isUserAction.current = true;
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const handleClear = () => {
    isUserAction.current = false;
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    onDebounceRef.current?.('');
  };

  const displayValue = isControlled ? controlledValue : internalValue;

  return (
    <div className={cn('relative flex items-center w-full max-w-sm', className)}>
      <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
      />
      {displayValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
