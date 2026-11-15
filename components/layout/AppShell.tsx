'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { useAuthStore } from '@/store/auth-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { fetchMe, user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      fetchMe();
    }
  }, [fetchMe, user]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Global Command Palette */}
      <CommandPalette />

      {/* Sidebar (Desktop fixed & Mobile drawer) */}
      <Sidebar
        isOpenMobile={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-60 min-w-0">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
