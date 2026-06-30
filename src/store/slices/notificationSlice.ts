import type { NotificationItem } from '../types';

export interface NotificationSlice {
  notifications: NotificationItem[];
  fetchNotifications: () => void;
  markNotificationsRead: () => void;
  addNotification: (n: NotificationItem) => void;
}

export const createNotificationSlice = (set: any, _get: any, _api: any) => ({
  notifications: [
    {
      id: '1',
      title: 'Complaint Assigned',
      body: 'CIV-002 has been assigned to Sanitation Department.',
      read: false,
      time: '2026-05-29T15:00:00Z',
      complaintId: 'CIV-002',
    },
    {
      id: '2',
      title: 'Status Updated',
      body: 'CIV-001 is now In Progress. Roads Department is working on it.',
      read: true,
      time: '2026-05-29T12:00:00Z',
      complaintId: 'CIV-001',
    },
    {
      id: '3',
      title: 'Complaint Resolved',
      body: 'CIV-003 has been resolved. Streetlight repaired.',
      read: true,
      time: '2026-05-28T16:00:00Z',
      complaintId: 'CIV-003',
    },
  ],

  fetchNotifications: () => {},
  markNotificationsRead: () => {
    set((state: any) => ({
      notifications: state.notifications.map((n: NotificationItem) => ({ ...n, read: true })),
    }));
  },
  addNotification: (n: NotificationItem) =>
    set((state: any) => ({
      notifications: [n, ...state.notifications],
    })),
} satisfies NotificationSlice);
