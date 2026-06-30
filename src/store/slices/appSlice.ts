import type { LanguageCode } from '../../i18n';

export interface AppSlice {
  hasSeenLaunch: boolean;
  setHasSeenLaunch: (v: boolean) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  isFetching: boolean;
  setFetching: (v: boolean) => void;
  isLiveMode: boolean;
  setLiveMode: (v: boolean) => void;
  language: LanguageCode;
  setLanguage: (v: LanguageCode) => void;
}

export const createAppSlice = (set: any, _get: any, _api: any) => ({
  hasSeenLaunch: false,
  setHasSeenLaunch: (v: boolean) => set({ hasSeenLaunch: v }),
  isLoading: false,
  setLoading: (v: boolean) => set({ isLoading: v }),
  isFetching: false,
  setFetching: (v: boolean) => set({ isFetching: v }),
  isLiveMode: false,
  setLiveMode: (v: boolean) => set({ isLiveMode: v }),
  language: 'en' as LanguageCode,
  setLanguage: (v: LanguageCode) => set({ language: v }),
} satisfies AppSlice);
