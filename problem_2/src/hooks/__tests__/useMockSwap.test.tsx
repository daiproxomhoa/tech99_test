import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMockSwap } from '../useMockSwap';

describe('useMockSwap', () => {
  const req = {
    fromSymbol: 'ETH',
    toSymbol: 'USDC',
    fromAmount: 1,
    toAmount: 2500,
    rate: 2500,
  };

  it('starts idle', () => {
    const { result } = renderHook(() => useMockSwap());
    expect(result.current.status).toBe('idle');
    expect(result.current.lastResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('transitions idle → submitting → success and exposes a tx hash', async () => {
    const { result } = renderHook(() => useMockSwap());
    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.submit(req);
    });
    expect(result.current.status).toBe('submitting');
    const out = (await promise) as { txHash: string };
    expect(out.txHash).toMatch(/^0x[0-9a-f]{32}$/);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.lastResult?.txHash).toBe(out.txHash);
  });

  it('reset returns to idle', async () => {
    const { result } = renderHook(() => useMockSwap());
    await act(async () => {
      await result.current.submit(req);
    });
    expect(result.current.status).toBe('success');
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});
