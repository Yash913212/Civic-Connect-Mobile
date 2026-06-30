import { api } from './api';

export interface LoginResponse {
  access_token: string;
  role: string;
  name: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },

  register: async (payload: RegisterPayload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
};
