import { render, type RenderOptions } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import type { ReactElement, ReactNode } from 'react';
import { LocaleProvider } from '@/i18n/LocaleProvider';

/**
 * Minimal IntlProvider wrapper — no messages map, so react-intl falls back
 * to each MessageDescriptor's defaultMessage. Used for component tests
 * that don't need translation behavior.
 */
export function renderIntl(ui: ReactElement, locale = 'en', options?: RenderOptions) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <IntlProvider locale={locale} defaultLocale="en" messages={{}} onError={() => {}}>
        <LocaleProvider>{children}</LocaleProvider>
      </IntlProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
