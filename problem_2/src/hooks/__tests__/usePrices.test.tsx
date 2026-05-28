import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { usePrices } from '../usePrices';

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('usePrices (integration with MSW)', () => {
  it('returns normalized tokens from the network', async () => {
    const { result } = renderHook(() => usePrices(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const symbols = result.current.data!.map((t) => t.symbol);
    expect(symbols).toContain('ETH');
    expect(symbols).toContain('USDC');
    expect(symbols).not.toContain('BROKEN');
    expect(symbols).not.toContain('BAD');
    // freshest ETH price wins
    expect(result.current.data!.find((t) => t.symbol === 'ETH')!.price).toBe(2500);
  });
});
