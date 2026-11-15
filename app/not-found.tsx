import React from 'react';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-[var(--text)] tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-[var(--text)] mt-2">Page not found</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mt-1">
        Sorry, we couldn&apos;t find the page you are looking for. It might have been moved or removed.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </a>
      </div>
    </div>
  );
}
