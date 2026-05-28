/**
 * Token / price domain logic.
 *
 * The Switcheo prices.json endpoint returns repeated entries per currency
 * (different timestamps). We normalize the feed to one record per symbol,
 * keeping the freshest entry, and drop anything without a usable price.
 */

export interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

export interface Token {
  /** Canonical uppercase symbol, e.g. "ETH" */
  symbol: string;
  /** USD price */
  price: number;
  /** ISO timestamp of the price quote */
  date: string;
  /** CDN URL for the token icon SVG */
  iconUrl: string;
}

export const PRICES_URL = 'https://interview.switcheo.com/prices.json';
const ICON_BASE = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

const SAFE_SYMBOL = /^[A-Z0-9]{1,12}$/;

export function tokenIconUrl(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (!SAFE_SYMBOL.test(upper)) return '';
  return `${ICON_BASE}/${upper}.svg`;
}

/**
 * Reduce a price feed to one Token per symbol, freshest entry wins.
 * Filters out entries with non-positive or non-finite prices.
 */
export function normalizePrices(raw: unknown): Token[] {
  if (!Array.isArray(raw)) return [];
  const bySymbol = new Map<string, PriceEntry>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Partial<PriceEntry>;
    if (typeof e.currency !== 'string' || typeof e.price !== 'number') continue;
    if (!Number.isFinite(e.price) || e.price <= 0) continue;
    const symbol = e.currency.toUpperCase();
    if (!SAFE_SYMBOL.test(symbol)) continue;
    const prev = bySymbol.get(symbol);
    const date = typeof e.date === 'string' ? e.date : '';
    if (!prev || date > prev.date) {
      bySymbol.set(symbol, { currency: symbol, date, price: e.price });
    }
  }
  return Array.from(bySymbol.values())
    .map((e) => ({
      symbol: e.currency,
      price: e.price,
      date: e.date,
      iconUrl: tokenIconUrl(e.currency),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function fetchPrices(signal?: AbortSignal): Promise<Token[]> {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) throw new Error(`Prices fetch failed: ${res.status}`);
  const data = await res.json();
  return normalizePrices(data);
}
