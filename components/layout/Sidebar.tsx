'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Stethoscope, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Patients', href: '/patients', icon: Users },
];

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)]">
        <a href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-[var(--text)] tracking-tight">Doctor Tracker</span>
        </a>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--background)]',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-md" />
              )}
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)]')} />
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <div className="flex justify-between items-center">
          <span>Doctor Tracker</span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--background)] font-mono text-[10px]">v1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[var(--surface)] shadow-xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
