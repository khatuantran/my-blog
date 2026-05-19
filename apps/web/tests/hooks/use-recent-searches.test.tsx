import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from '@/hooks/use-recent-searches';

describe('useRecentSearches', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initial empty array', () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.items).toEqual([]);
  });

  it('add → unshift + persist localStorage', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add('first'));
    act(() => result.current.add('second'));
    expect(result.current.items).toEqual(['second', 'first']);
    const stored = JSON.parse(window.localStorage.getItem('myblog.recentSearches') ?? '[]');
    expect(stored).toEqual(['second', 'first']);
  });

  it('dedupe case-insensitive — move to front', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add('react'));
    act(() => result.current.add('vue'));
    act(() => result.current.add('REACT'));
    expect(result.current.items).toEqual(['REACT', 'vue']);
  });

  it('max 10 — oldest evicted', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      for (let i = 0; i < 12; i++) result.current.add(`q${i}`);
    });
    expect(result.current.items).toHaveLength(10);
    expect(result.current.items[0]).toBe('q11');
    expect(result.current.items.includes('q0')).toBe(false);
  });

  it('clear → empty array + localStorage updated', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add('one'));
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
    expect(window.localStorage.getItem('myblog.recentSearches')).toBe('[]');
  });

  it('empty trim → no-op', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add('   '));
    expect(result.current.items).toEqual([]);
  });

  it('initialize từ localStorage seeded', () => {
    window.localStorage.setItem('myblog.recentSearches', JSON.stringify(['saved-q']));
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.items).toEqual(['saved-q']);
  });
});
