'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/doctors': 'Doctor Management',
  '/patients': 'Patient Directory',
};

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive title from pathname
  const title =
    PAGE_TITLES[pathname] ||
    (pathname.startsWith('/doctors/') ? 'Doctor Details' : 'Doctor Tracker');

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DT';

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--background)]"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight">{title}</h1>
      </div>

      {/* Right: Search shortcut & User Menu */}
      <div className="flex items-center gap-3">
        {/* Search button (triggers command palette) */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-muted)] hover:border-[var(--primary)] transition-colors"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-command-palette'));
          }}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Bell Dropdown */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-[var(--border)] transition-all"
            aria-expanded={isDropdownOpen}
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              {initials}
            </div>
            <div className="hidden lg:flex flex-col items-start text-xs text-left">
              <span className="font-medium text-[var(--text)] leading-tight">{user?.name || 'Administrator'}</span>
              <span className="text-[10px] text-[var(--text-muted)] capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</span>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg py-1.5 z-50 text-sm">
              <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
                <p className="font-medium text-[var(--text)]">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    await logout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
