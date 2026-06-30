import axios from 'axios';
import { API_URL } from '../../env';
import { wsManager } from '../websocket';
import type { User } from '../types';

export interface AuthSlice {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, mobile: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const createAuthSlice = (set: any, _get: any, _api: any) => ({
  isLoggedIn: false,
  user: null as User | null,
  token: null as string | null,

  login: async (email: string, password: string) => {
    const live = false;
    if (live) {
      try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { access_token, role, name } = res.data;
        const userObj: User = { id: '1', email, name, mobile: '+91 9999999999', role };
        set({ isLoggedIn: true, user: userObj, token: access_token });
        wsManager.connect(email);
        return true;
      } catch (e) {
        console.log('Live server auth failed, falling back to mock authentication.');
      }
    }

    const role = email.includes('admin') ? 'Admin' : email.includes('officer') ? 'Officer' : 'Citizen';
    const dept = email.includes('officer') ? 'Roads Department' : undefined;
    set({
      isLoggedIn: true,
      user: { id: '1', name: email.split('@')[0].toUpperCase() || 'Citizen User', email, mobile: '+91 9876543210', role, department: dept },
    });
    return true;
  },

  signup: async (name: string, email: string, mobile: string, password: string) => {
    const live = false;
    if (live) {
      try {
        await axios.post(`${API_URL}/auth/register`, { name, email, password, mobile, role: 'Citizen' });
        return true;
      } catch (e) {
        console.log('Live signup failed, falling back to mock registration.');
      }
    }
    set({ isLoggedIn: true, user: { id: '1', name, email, mobile, role: 'Citizen' } });
    return true;
  },

  logout: () => {
    wsManager.disconnect();
    set({ isLoggedIn: false, user: null, token: null });
  },

  updateProfile: (data: Partial<User>) => {
    set((state: any) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
} satisfies AuthSlice);
