import { useCallback, useEffect, useState } from 'react';
import { type HistoryEntry, loadHistory, saveHistory } from '@/lib/storage';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());

  useEffect(() => {
    saveHistory(entries);
  }, [entries]);

  const add = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    setEntries((prev) =>
      [
        {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 20),
    );
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, clear };
}
