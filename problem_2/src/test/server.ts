import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { PRICES_URL } from '@/lib/tokens';

export const mockPrices = [
  { currency: 'ETH', date: '2024-01-01T00:00:00Z', price: 2000 },
  { currency: 'ETH', date: '2024-01-02T00:00:00Z', price: 2500 },
  { currency: 'USDC', date: '2024-01-02T00:00:00Z', price: 1 },
  { currency: 'BTC', date: '2024-01-02T00:00:00Z', price: 50000 },
  { currency: 'SWTH', date: '2024-01-02T00:00:00Z', price: 0.005 },
  // Junk entries that should be filtered out.
  { currency: 'BROKEN', date: '2024-01-02T00:00:00Z', price: 0 },
  { currency: 'BAD', date: '2024-01-02T00:00:00Z' },
];

export const handlers = [
  http.get(PRICES_URL, () => HttpResponse.json(mockPrices)),
];

export const server = setupServer(...handlers);
