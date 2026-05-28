import { describe, expect, it } from 'vitest';
import { buildPath, mockSeries } from '../sparkline';

describe('mockSeries', () => {
  it('is deterministic per symbol', () => {
    expect(mockSeries('ETH', 1000)).toEqual(mockSeries('ETH', 1000));
  });

  it('returns the requested number of points and ends at the current price', () => {
    const s = mockSeries('ETH', 1000, 10);
    expect(s).toHaveLength(10);
    expect(s[s.length - 1]).toBe(1000);
  });

  it('produces different shapes for different symbols', () => {
    expect(mockSeries('ETH', 1000)).not.toEqual(mockSeries('BTC', 1000));
  });
});

describe('buildPath', () => {
  it('emits one coordinate per point', () => {
    const path = buildPath([1, 2, 3], 100, 30);
    expect(path.split(' ')).toHaveLength(3);
  });

  it('returns empty string for empty series', () => {
    expect(buildPath([], 100, 30)).toBe('');
  });
});
