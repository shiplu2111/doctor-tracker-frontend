'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Stethoscope,
  UserMinus,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import { AppNotification, UnreadCountResponse } from '@doctor-tracker/shared';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'doctor:created':
      return <Stethoscope className="w-4 h-4 text-blue-500" />;
    case 'doctor:deleted':
      return <UserMinus className="w-4 h-4 text-amber-500" />;
    case 'patient:critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'patient:created':
      return <UserCheck className="w-4 h-4 text-emerald-500" />;
    default:
      return <Bell className="w-4 h-4 text-[var(--text-muted)]" />;
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Poll unread count every 60s
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient<UnreadCountResponse>('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 60000,
  });

  const unreadCount = countData?.unreadCount ?? 0;

  // Fetch recent notifications when dropdown is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const res = await apiClient<AppNotification[]>('/notifications?limit=10');
      return res.data;
    },
    enabled: isOpen,
  });

  const notifications = notificationsData || [];

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient('/notifications/read-all', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    setIsOpen(false);

    if (notification.entity?.kind === 'doctor') {
      router.push(`/doctors/${notification.entity.id}`);
    } else if (notification.entity?.kind === 'patient') {
      router.push('/patients');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={isOpen}
        className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--background)] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[var(--surface)] animate-in fade-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Notifications panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl z-50 overflow-hidden text-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--text)] text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-500/70" />
                <p className="font-medium text-[var(--text)]">You&apos;re all caught up</p>
                <p className="text-[11px]">No notifications at this time.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.readAt;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-[var(--background)] ${
                      isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-semibold text-[var(--text)]'
                              : 'font-medium text-[var(--text-muted)]'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                    {isUnread && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
