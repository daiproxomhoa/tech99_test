/**
 * Tiny localStorage wrapper with JSON + schema validation. Silent failure
 * on quota or SSR — we never throw to the UI.
 */

export function readJson<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or disabled — ignore */
  }
}

export interface HistoryEntry {
  id: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: number;
}

export const HISTORY_KEY = 'swap:history:v1';
export const SETTINGS_KEY = 'swap:settings:v1';
export const THEME_KEY = 'swap:theme:v1';

export interface SwapSettings {
  slippagePct: number;
  feeBps: number;
}

export const DEFAULT_SETTINGS: SwapSettings = {
  slippagePct: 0.5,
  feeBps: 30,
};

function isHistoryArray(v: unknown): v is HistoryEntry[] {
  return (
    Array.isArray(v) &&
    v.every(
      (e) =>
        e &&
        typeof e === 'object' &&
        typeof (e as HistoryEntry).id === 'string' &&
        typeof (e as HistoryEntry).fromSymbol === 'string' &&
        typeof (e as HistoryEntry).toSymbol === 'string',
    )
  );
}

export function loadHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, [], isHistoryArray);
}

export function saveHistory(entries: HistoryEntry[]): void {
  writeJson(HISTORY_KEY, entries.slice(0, 20));
}

export function loadSettings(): SwapSettings {
  return readJson<SwapSettings>(SETTINGS_KEY, DEFAULT_SETTINGS, (v): v is SwapSettings => {
    return (
      !!v &&
      typeof v === 'object' &&
      typeof (v as SwapSettings).slippagePct === 'number' &&
      typeof (v as SwapSettings).feeBps === 'number'
    );
  });
}

export function saveSettings(s: SwapSettings): void {
  writeJson(SETTINGS_KEY, s);
}
