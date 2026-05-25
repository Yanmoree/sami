import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ru } from './locales/ru';
import { en } from './locales/en';

export type Locale = 'ru' | 'en';
export type TranslationKey = keyof typeof ru;

const dicts: Record<Locale, Record<string, string>> = { ru, en };

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

function detectInitial(): Locale {
  if (typeof navigator === 'undefined') return 'ru';
  const lang = (navigator.language || 'ru').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  return 'ru';
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectInitial(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'sami_locale',
    },
  ),
);

/**
 * Хук-функция перевода. Использование:
 *   const t = useTranslation();
 *   t('home.heroTitle');
 *
 * Поддерживает шаблоны: t('footer.copyright', { year: 2026 }) → "© 2026 SAMI..."
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: TranslationKey | string, vars?: Record<string, string | number>): string => {
    const dict = dicts[locale];
    const raw = dict[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };
}

export function useLocale() {
  return useLocaleStore((s) => s.locale);
}

export function useSetLocale() {
  return useLocaleStore((s) => s.setLocale);
}
