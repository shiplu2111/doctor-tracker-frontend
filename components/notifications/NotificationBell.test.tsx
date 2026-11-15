import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const mockApiClient = vi.fn();
vi.mock('@/lib/api/api-client', () => ({
  apiClient: (...args: unknown[]) => mockApiClient(...args),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('NotificationBell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell button and badge when unread notifications exist', async () => {
    mockApiClient.mockImplementation(async (url: string) => {
      if (url === '/notifications/unread-count') {
        return { data: { unreadCount: 3 } };
      }
      return { data: [] };
    });

    renderWithClient(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeDefined();
    });
  });

  it('toggles dropdown and shows notification items on click', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'doctor:created',
        title: 'New Doctor Registered',
        message: 'Dr. John Doe has joined Cardiology.',
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ];

    mockApiClient.mockImplementation(async (url: string) => {
      if (url === '/notifications/unread-count') {
        return { data: { unreadCount: 1 } };
      }
      if (url.startsWith('/notifications?')) {
        return { data: mockNotifications };
      }
      return { data: null };
    });

    renderWithClient(<NotificationBell />);

    const button = await screen.findByRole('button', { name: /1 unread notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeDefined();
      expect(screen.getByText('New Doctor Registered')).toBeDefined();
      expect(screen.getByText('Dr. John Doe has joined Cardiology.')).toBeDefined();
    });
  });

  it('shows empty state when there are no notifications', async () => {
    mockApiClient.mockImplementation(async (url: string) => {
      if (url === '/notifications/unread-count') {
        return { data: { unreadCount: 0 } };
      }
      if (url.startsWith('/notifications?')) {
        return { data: [] };
      }
      return { data: null };
    });

    renderWithClient(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/You're all caught up/i)).toBeDefined();
    });
  });
});
