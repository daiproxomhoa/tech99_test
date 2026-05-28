import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHistory } from '../useHistory';

beforeEach(() => window.localStorage.clear());

describe('useHistory', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.entries).toEqual([]);
  });

  it('adds entries to the front', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.add({
        fromSymbol: 'ETH',
        toSymbol: 'USDC',
        fromAmount: 1,
        toAmount: 2500,
        rate: 2500,
      });
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].fromSymbol).toBe('ETH');
    act(() => {
      result.current.add({
        fromSymbol: 'BTC',
        toSymbol: 'USDC',
        fromAmount: 1,
        toAmount: 50000,
        rate: 50000,
      });
    });
    expect(result.current.entries[0].fromSymbol).toBe('BTC');
  });

  it('clears entries', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.add({
        fromSymbol: 'ETH',
        toSymbol: 'USDC',
        fromAmount: 1,
        toAmount: 1,
        rate: 1,
      });
    });
    expect(result.current.entries).toHaveLength(1);
    act(() => result.current.clear());
    expect(result.current.entries).toEqual([]);
  });
});
