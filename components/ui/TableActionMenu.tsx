'use client';

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};

interface TableActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function TableActionMenu({
  isOpen,
  onToggle,
  onClose,
  ariaLabel = 'Row actions menu',
  className,
  children,
}: TableActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 190;

    setMenuStyle({
      position: 'fixed',
      zIndex: 9999,
      right: Math.max(8, window.innerWidth - rect.right),
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => onClose();
      window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, updatePosition, onClose]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <>
            {/* Backdrop to catch clicks outside */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            />
            {/* Dropdown Menu */}
            <div
              style={menuStyle}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-44 rounded-xl bg-white shadow-xl border border-slate-200 py-1 focus:outline-none animate-in fade-in zoom-in-95 duration-100',
                className,
              )}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
