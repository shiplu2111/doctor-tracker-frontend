'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Stethoscope, AlertCircle } from 'lucide-react';
import { loginSchema, LoginInput } from '@doctor-tracker/shared';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from '@/lib/api/api-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data);
      router.push(decodeURIComponent(nextUrl));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Doctor Tracker</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to your administrative account</p>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              disabled={isSubmitting}
              placeholder="admin@example.com"
              {...register('email')}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent outline-none transition-all ${
                errors.email
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-950'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isSubmitting}
                placeholder="••••••••••"
                {...register('password')}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm bg-transparent outline-none transition-all ${
                  errors.password
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-950'
                    : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[var(--primary)] hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Demo Credentials
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">Click to auto-fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@example.com', { shouldValidate: true });
                setValue('password', 'ChangeMe-12345', { shouldValidate: true });
                setServerError(null);
              }}
              className="p-2.5 text-left rounded-xl border border-[var(--border)] hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)] group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Admin
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                  Full Access
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-1">admin@example.com</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('email', 'viewer@example.com', { shouldValidate: true });
                setValue('password', 'ChangeMe-12345', { shouldValidate: true });
                setServerError(null);
              }}
              className="p-2.5 text-left rounded-xl border border-[var(--border)] hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Viewer
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                  Read Only
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-1">viewer@example.com</p>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Doctor Tracker. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
