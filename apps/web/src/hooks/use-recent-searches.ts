import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'myblog.recentSearches';
const MAX = 10;

function readStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX);
  } catch {
    return [];
  }
}

function writeStorage(items: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // Quota exceeded or storage disabled — silently ignore
  }
}

export function useRecentSearches(): {
  items: string[];
  add: (q: string) => void;
  clear: () => void;
} {
  const [items, setItems] = useState<string[]>(() => readStorage());

  useEffect(() => {
    writeStorage(items);
  }, [items]);

  const add = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setItems((prev) => {
      const filtered = prev.filter((x) => x.toLowerCase() !== q.toLowerCase());
      return [q, ...filtered].slice(0, MAX);
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, add, clear };
}
