import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { IntlProvider } from 'react-intl';
import { LOCALES, type Locale } from './config';
import enCompiled from './compiled-lang/en.json';
import viCompiled from './compiled-lang/vi.json';

const LOCALE_KEY = 'swap:locale:v1';

/**
 * Compiled catalogs are produced by `npm run i18n:compile` — they're an
 * object keyed by the auto-generated id (hash of defaultMessage +
 * description). At runtime react-intl looks the id up here; if a locale's
 * file is missing a key, it falls back to the inline defaultMessage in
 * source, which is also the en source of truth.
 */
// Compiled output is an AST per id (array of { type, value }). react-intl
// accepts it directly via the `messages` prop.
type CompiledCatalog = Record<string, unknown>;
const catalogs: Record<Locale, CompiledCatalog> = {
  en: enCompiled as CompiledCatalog,
  vi: viCompiled as CompiledCatalog,
};

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LOCALE_KEY);
  if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  const nav = navigator.language?.toLowerCase() ?? 'en';
  return nav.startsWith('vi') ? 'vi' : 'en';
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const ctxValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={ctxValue}>
      <IntlProvider
        locale={locale}
        defaultLocale="en"
        // react-intl typings expect Record<string,string> but the AST form
        // is documented and supported at runtime.
        messages={catalogs[locale] as Record<string, string>}
        onError={(err) => {
          if (import.meta.env?.DEV) console.warn('[intl]', err.message);
        }}
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
