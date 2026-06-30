import { useAppStore } from '../store';
import { en } from './en';
import { te } from './te';
import { hi } from './hi';

type DeepRecord = { [key: string]: string | DeepRecord };

const translations: Record<string, DeepRecord> = { en, te, hi };

function deepGet(obj: DeepRecord, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current?.[key] == null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export function t(path: string): string {
  const lang = useAppStore.getState().language || 'en';
  const langDict = translations[lang];
  if (!langDict) return deepGet(translations.en as DeepRecord, path);
  const result = deepGet(langDict, path);
  if (result === path) return deepGet(translations.en as DeepRecord, path);
  return result;
}

export type LanguageCode = 'en' | 'te' | 'hi';

export const LANGUAGES: { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];
