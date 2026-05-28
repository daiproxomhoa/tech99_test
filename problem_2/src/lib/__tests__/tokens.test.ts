import { describe, expect, it } from 'vitest';
import { normalizePrices, tokenIconUrl, fetchPrices, PRICES_URL } from '../tokens';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';

describe('normalizePrices', () => {
  it('returns an empty array when input is not an array', () => {
    expect(normalizePrices(null)).toEqual([]);
    expect(normalizePrices(undefined)).toEqual([]);
    expect(normalizePrices({})).toEqual([]);
  });

  it('drops entries with invalid or non-positive prices', () => {
    const out = normalizePrices([
      { currency: 'A', date: '2024-01-01', price: 0 },
      { currency: 'B', date: '2024-01-01', price: -1 },
      { currency: 'C', date: '2024-01-01', price: Number.NaN },
      { currency: 'D', date: '2024-01-01', price: 1 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].symbol).toBe('D');
  });

  it('uppercases symbols and dedupes keeping the freshest date', () => {
    const out = normalizePrices([
      { currency: 'eth', date: '2024-01-01', price: 1000 },
      { currency: 'ETH', date: '2024-01-05', price: 2000 },
      { currency: 'eth', date: '2024-01-03', price: 1500 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ symbol: 'ETH', price: 2000 });
  });

  it('sorts result alphabetically by symbol', () => {
    const out = normalizePrices([
      { currency: 'C', date: 'x', price: 1 },
      { currency: 'A', date: 'x', price: 1 },
      { currency: 'B', date: 'x', price: 1 },
    ]);
    expect(out.map((t) => t.symbol)).toEqual(['A', 'B', 'C']);
  });

  it('attaches a token icon URL', () => {
    const out = normalizePrices([{ currency: 'SWTH', date: '', price: 1 }]);
    expect(out[0].iconUrl).toBe(tokenIconUrl('SWTH'));
    expect(out[0].iconUrl).toMatch(/SWTH\.svg$/);
  });

  it('handles entries with missing date by defaulting to empty string', () => {
    const out = normalizePrices([
      { currency: 'X', price: 10 } as unknown,
      { currency: 'X', date: '2024-01-02', price: 20 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ symbol: 'X', price: 20, date: '2024-01-02' });
  });

  it('skips null/undefined and non-object items', () => {
    const out = normalizePrices([
      null,
      undefined,
      'foo',
      42,
      { currency: 'A', date: '', price: 1 },
    ]);
    expect(out.map((t) => t.symbol)).toEqual(['A']);
  });

  it('rejects symbols that fail SAFE_SYMBOL regex', () => {
    const out = normalizePrices([
      { currency: '../evil', date: '', price: 1 },
      { currency: 'WITH SPACE', date: '', price: 1 },
      { currency: 'TOOLONGSYMBOL13', date: '', price: 1 },
      { currency: '', date: '', price: 1 },
      { currency: 'GOOD', date: '', price: 1 },
    ]);
    expect(out.map((t) => t.symbol)).toEqual(['GOOD']);
  });

  it('keeps the existing entry when a newer one has an older date', () => {
    const out = normalizePrices([
      { currency: 'ETH', date: '2024-05-01', price: 3000 },
      { currency: 'ETH', date: '2024-04-01', price: 2500 },
    ]);
    expect(out[0]).toMatchObject({ symbol: 'ETH', price: 3000 });
  });

  it('returns an empty array when prices field is non-number', () => {
    const out = normalizePrices([
      { currency: 'A', date: '', price: '10' as unknown as number },
      { currency: 'B', date: '', price: null as unknown as number },
    ]);
    expect(out).toEqual([]);
  });
});

describe('tokenIconUrl', () => {
  it('returns CDN URL for valid symbol', () => {
    expect(tokenIconUrl('ETH')).toMatch(/\/tokens\/ETH\.svg$/);
  });

  it('uppercases the symbol', () => {
    expect(tokenIconUrl('eth')).toMatch(/\/ETH\.svg$/);
  });

  it('returns empty string for invalid symbols', () => {
    expect(tokenIconUrl('../evil')).toBe('');
    expect(tokenIconUrl('WITH SPACE')).toBe('');
    expect(tokenIconUrl('')).toBe('');
    expect(tokenIconUrl('TOOLONGSYMBOL13')).toBe('');
    expect(tokenIconUrl('A.B')).toBe('');
  });
});

describe('fetchPrices', () => {
  it('throws when the response is non-2xx', async () => {
    server.use(http.get(PRICES_URL, () => new HttpResponse(null, { status: 500 })));
    await expect(fetchPrices()).rejects.toThrow(/500/);
  });

  it('returns a normalized token list on success', async () => {
    server.use(
      http.get(PRICES_URL, () =>
        HttpResponse.json([
          { currency: 'A', date: '2024-01-01', price: 5 },
          { currency: 'B', date: '2024-01-01', price: 0 },
        ]),
      ),
    );
    const tokens = await fetchPrices();
    expect(tokens.map((t) => t.symbol)).toEqual(['A']);
  });

  it('aborts when signal is triggered', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(fetchPrices(ctrl.signal)).rejects.toThrow();
  });
});
