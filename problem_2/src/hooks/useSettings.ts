import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings, type SwapSettings } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<SwapSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<SwapSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  return { settings, update };
}
