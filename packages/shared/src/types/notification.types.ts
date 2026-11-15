export type NotificationType =
  | 'doctor:created'
  | 'doctor:deleted'
  | 'patient:created'
  | 'patient:critical';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entity?: {
    kind: 'doctor' | 'patient';
    id: string;
  };
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
