import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  HISTORY_KEY,
  SETTINGS_KEY,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
} from '../storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('history storage', () => {
  it('returns an empty array when nothing is saved', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('round-trips entries and caps at 20', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      id: `${i}`,
      fromSymbol: 'A',
      toSymbol: 'B',
      fromAmount: 1,
      toAmount: 1,
      rate: 1,
      timestamp: i,
    }));
    saveHistory(many);
    const loaded = loadHistory();
    expect(loaded).toHaveLength(20);
  });

  it('rejects malformed payloads', () => {
    window.localStorage.setItem(HISTORY_KEY, '{"not":"an array"}');
    expect(loadHistory()).toEqual([]);
  });
});

describe('settings storage', () => {
  it('falls back to defaults when no value is saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips valid settings', () => {
    saveSettings({ slippagePct: 1.5, feeBps: 50 });
    expect(loadSettings()).toEqual({ slippagePct: 1.5, feeBps: 50 });
  });

  it('rejects invalid stored settings shape', () => {
    window.localStorage.setItem(SETTINGS_KEY, '"oops"');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
