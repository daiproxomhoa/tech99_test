import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { formatAmount as fmtAmount, formatUsd as fmtUsd } from '@/lib/format';

/**
 * Locale-aware wrappers around the pure formatters in lib/format. Components
 * call this hook instead of importing the raw helpers so number formatting
 * follows the current IntlProvider locale.
 */
export function useFormatters() {
  const { locale } = useIntl();
  const formatUsd = useCallback((v: number) => fmtUsd(v, locale), [locale]);
  const formatAmount = useCallback((v: number) => fmtAmount(v, locale), [locale]);
  return { formatUsd, formatAmount };
}
