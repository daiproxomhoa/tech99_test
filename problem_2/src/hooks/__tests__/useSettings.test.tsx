import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../useSettings';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@/lib/storage';

beforeEach(() => window.localStorage.clear());

describe('useSettings', () => {
  it('returns defaults when storage is empty', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('persists patches and round-trips through storage', () => {
    const { result, unmount } = renderHook(() => useSettings());
    act(() => result.current.update({ slippagePct: 1.25 }));
    expect(result.current.settings.slippagePct).toBe(1.25);
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY)!).slippagePct).toBe(1.25);
    unmount();
    const { result: fresh } = renderHook(() => useSettings());
    expect(fresh.current.settings.slippagePct).toBe(1.25);
  });

  it('merges patches without dropping other fields', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ feeBps: 50 }));
    expect(result.current.settings).toEqual({ ...DEFAULT_SETTINGS, feeBps: 50 });
  });
});
