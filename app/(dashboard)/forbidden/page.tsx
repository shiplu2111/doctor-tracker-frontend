import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">403 Forbidden</h1>
      <h2 className="text-lg font-semibold text-[var(--text)] mt-2">Access Denied</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mt-1">
        You do not have the required permissions to access this feature or perform this action.
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
