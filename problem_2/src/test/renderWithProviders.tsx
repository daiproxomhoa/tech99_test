import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { LocaleProvider } from '@/i18n/LocaleProvider';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  locale?: Locale;
  client?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { locale = 'en', client, ...rest }: Options = {},
) {
  // LocaleProvider seeds its own locale from localStorage on mount — write it
  // BEFORE the provider renders so the chosen locale takes effect.
  window.localStorage.setItem('swap:locale:v1', locale);

  const qc =
    client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LocaleProvider>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </LocaleProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}
