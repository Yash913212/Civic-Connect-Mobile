import axios from 'axios';
import { API_URL } from '../env';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { useAppStore } = require('../store');
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { useAppStore } = require('../store');
      useAppStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
