/**
 * Number formatting helpers. All locale-aware via Intl.
 * Formatters are cached per (locale + options) tuple — constructing
 * Intl.NumberFormat is hot-path expensive.
 */

const cache = new Map<string, Intl.NumberFormat>();

function nf(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    cache.set(key, f);
  }
  return f;
}

const DEFAULT_LOCALE = 'en-US';

/** Format USD amount like $1,234.56 — auto-compacts above 1M. */
export function formatUsd(value: number, locale: string = DEFAULT_LOCALE): string {
  if (!Number.isFinite(value)) {
    return nf(locale, { style: 'currency', currency: 'USD' }).format(0);
  }
  if (value === 0) {
    return nf(locale, { style: 'currency', currency: 'USD' }).format(0);
  }
  if (Math.abs(value) < 0.01) {
    // Locale-aware "<$0.01"
    const min = nf(locale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(0.01);
    return `<${min}`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return nf(locale, {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }
  return nf(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a token amount with adaptive precision:
 * - tiny amounts get more decimals
 * - large amounts compact
 */
export function formatAmount(value: number, locale: string = DEFAULT_LOCALE): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 1_000_000) {
    return nf(locale, { notation: 'compact', maximumFractionDigits: 3 }).format(value);
  }
  if (abs >= 0.0001) return nf(locale, { maximumFractionDigits: 6 }).format(value);
  return value.toPrecision(3);
}

/**
 * Sanitize a user-typed amount. Accepts digits and a single dot.
 * Returns the cleaned string (may be empty). Always uses '.' as the
 * decimal separator internally — locale formatting is for display only.
 */
export function sanitizeAmountInput(raw: string): string {
  // Comma is the decimal mark in vi/fr/etc — but only when no dot is
  // present. Otherwise the comma is acting as a thousands separator and
  // should be stripped (e.g. "$1,234.50" → "1234.50").
  const normalized = raw.includes('.') ? raw.replace(/,/g, '') : raw.replace(',', '.');
  let cleaned = normalized.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
    cleaned = cleaned.replace(/^0+/, '') || '0';
  }
  return cleaned;
}

/** Parse a sanitized amount string. Returns NaN if invalid/empty. */
export function parseAmount(raw: string): number {
  if (!raw || raw === '.') return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}
