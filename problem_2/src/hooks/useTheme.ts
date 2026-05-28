import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { THEME_KEY } from '@/lib/storage';

type Theme = 'light' | 'dark';

/**
 * Element to toggle the `dark` class on. Default = <html>. When embedded as
 * a custom element, the host overrides this with a div inside the shadow
 * root so Tailwind's `dark:` selector can resolve against the shadow tree.
 */
export const ThemeRootContext = createContext<HTMLElement | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const ctxRoot = useContext(ThemeRootContext);

  useEffect(() => {
    const root = ctxRoot ?? document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme, ctxRoot]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle };
}
