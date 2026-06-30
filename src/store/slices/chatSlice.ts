import { wsManager } from '../websocket';
import type { ChatMessage } from '../types';
import { generateBotReply } from '../../services/nlp';
import { chatWithAI } from '../../services/ai';

export interface ChatSlice {
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => Promise<void>;
}

export const createChatSlice = (set: any, get: any, _api: any) => ({
  chatMessages: [
    {
      sender: 'bot' as const,
      text: 'Hello! I am your Civic Connect Virtual Assistant. I can track the status of your complaints, provide details about municipal departments, or guide you on how to file a new report. How can I help you today?',
      time: '10:00 AM',
    },
  ] as ChatMessage[],

  sendChatMessage: async (text: string) => {
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state: any) => ({
      chatMessages: [...state.chatMessages, { sender: 'user' as const, text, time: userTime }],
    }));

    if (wsManager.isConnected) {
      wsManager.send({ event: 'chat_query', query: text, user_id: 1 });
      return;
    }

    setTimeout(async () => {
      const state = get();
      let botText = await chatWithAI(text, state.chatMessages, state.complaints, state.user);

      if (!botText) {
        botText = generateBotReply(text);
      }

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      set((state: any) => ({
        chatMessages: [...state.chatMessages, { sender: 'bot' as const, text: botText, time }],
      }));
    }, 800);
  },
} satisfies ChatSlice);
