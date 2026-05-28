import { renderHook } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { useFormatters } from '../useFormatters';

function wrap(locale: string) {
  return ({ children }: { children: ReactNode }) => (
    <IntlProvider locale={locale} defaultLocale="en" messages={{}} onError={() => {}}>
      {children}
    </IntlProvider>
  );
}

describe('useFormatters', () => {
  it('formats with en locale by default', () => {
    const { result } = renderHook(() => useFormatters(), { wrapper: wrap('en-US') });
    expect(result.current.formatUsd(1234.5)).toMatch(/\$1,234\.50/);
    expect(result.current.formatAmount(1.234567)).toBe('1.234567');
  });

  it('formats with vi locale', () => {
    const { result } = renderHook(() => useFormatters(), { wrapper: wrap('vi-VN') });
    // vi-VN groups with '.', decimal with ','
    expect(result.current.formatUsd(1234.5)).toMatch(/1\.234,50/);
  });
});
