import { describe, expect, it } from 'vitest';
import { getRate, quote, reverseQuote } from '../swap';
import type { Token } from '../tokens';

const eth: Token = { symbol: 'ETH', price: 2000, date: '', iconUrl: '' };
const usdc: Token = { symbol: 'USDC', price: 1, date: '', iconUrl: '' };
const broken: Token = { symbol: 'BAD', price: 0, date: '', iconUrl: '' };

describe('getRate', () => {
  it('computes the ratio of USD prices', () => {
    expect(getRate(eth, usdc)).toBe(2000);
    expect(getRate(usdc, eth)).toBe(0.0005);
  });
  it('returns zero when either price is missing', () => {
    expect(getRate(broken, usdc)).toBe(0);
    expect(getRate(eth, broken)).toBe(0);
  });
});

describe('quote', () => {
  it('returns zeros for invalid amounts', () => {
    const q = quote({ from: eth, to: usdc, amount: 0 });
    expect(q.outputGross).toBe(0);
    expect(q.outputNet).toBe(0);
  });

  it('applies the fee on the output', () => {
    const q = quote({ from: eth, to: usdc, amount: 1, feeBps: 30, slippagePct: 0 });
    expect(q.outputGross).toBe(2000);
    expect(q.feeAmount).toBeCloseTo(6, 6); // 30 bps of 2000
    expect(q.outputNet).toBeCloseTo(1994, 6);
  });

  it('applies slippage to minReceived', () => {
    const q = quote({ from: eth, to: usdc, amount: 1, feeBps: 0, slippagePct: 1 });
    expect(q.outputNet).toBe(2000);
    expect(q.minReceived).toBeCloseTo(1980, 6); // -1%
  });
});

describe('reverseQuote', () => {
  it('inverts a quote', () => {
    const required = reverseQuote({ from: eth, to: usdc, amount: 1994, feeBps: 30 });
    expect(required).toBeCloseTo(1, 6);
  });
});
