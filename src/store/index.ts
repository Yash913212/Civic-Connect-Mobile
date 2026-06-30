import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wsManager, mapComplaintFromPayload } from './websocket';
import { createAppSlice } from './slices/appSlice';
import { createAuthSlice } from './slices/authSlice';
import { createComplaintSlice } from './slices/complaintSlice';
import { createChatSlice } from './slices/chatSlice';
import { createNotificationSlice } from './slices/notificationSlice';
import type { AppSlice } from './slices/appSlice';
import type { AuthSlice } from './slices/authSlice';
import type { ComplaintSlice } from './slices/complaintSlice';
import type { ChatSlice } from './slices/chatSlice';
import type { NotificationSlice } from './slices/notificationSlice';

export type { User, Complaint, NotificationItem, ChatMessage } from './types';

export type AppState = AppSlice & AuthSlice & ComplaintSlice & ChatSlice & NotificationSlice;

export const useAppStore = create<AppState>()(
  persist(
    (set, get, store) => ({
      ...createAppSlice(set, get, store),
      ...createAuthSlice(set, get, store),
      ...createComplaintSlice(set, get, store),
      ...createChatSlice(set, get, store),
      ...createNotificationSlice(set, get, store),
    }),
    {
      name: 'civic-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        complaints: state.complaints,
        notifications: state.notifications,
        chatMessages: state.chatMessages,
        hasSeenLaunch: state.hasSeenLaunch,
        language: state.language,
      }),
    }
  )
);

// Wire up WebSocket listeners to update the store in real-time
wsManager.subscribe((event, data) => {
  const state = useAppStore.getState();

  if (event === 'new_complaint') {
    const fresh = data;
    const mapped = mapComplaintFromPayload(fresh);
    useAppStore.setState({
      complaints: [mapped, ...state.complaints],
      notifications: [
        {
          id: Date.now().toString(),
          title: 'New Complaint Registered',
          body: `Grievance: ${fresh.title} was submitted to ${fresh.department}`,
          read: false,
          time: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    });
  } else if (event === 'complaint_status_update') {
    const update = data;
    useAppStore.setState({
      complaints: state.complaints.map((c) =>
        c.id === `CIV-${update.id}` || c.id === update.id
          ? {
              ...c,
              status: update.status || c.status,
              officerName: update.officer_name || c.officerName,
              priority: (update.priority ? update.priority.toLowerCase() : c.priority) as any,
            }
          : c
      ),
      notifications: [
        {
          id: Date.now().toString(),
          title: 'Grievance Update',
          body: `Complaint #${update.id} has been changed to ${update.status}`,
          read: false,
          time: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    });
  } else if (event === 'chat_reply') {
    useAppStore.setState({
      chatMessages: [
        ...state.chatMessages,
        {
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    });
  }
});

// Re-export individual slice creators for direct use if needed
export { createAppSlice, createAuthSlice, createComplaintSlice, createChatSlice, createNotificationSlice };
