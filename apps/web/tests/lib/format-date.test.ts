import { describe, expect, it } from 'vitest';
import { formatRelative, formatTimestamp } from '@/lib/format-date';

describe('formatTimestamp', () => {
  it('format ISO string → [YYYY-MM-DD HH:MM]', () => {
    const out = formatTimestamp('2026-05-17T12:30:45.000Z');
    expect(out).toMatch(/^\[2026-05-17 \d{2}:\d{2}\]$/);
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-05-18T12:00:00.000Z');
  it('< 30s → just now', () => {
    expect(formatRelative(new Date('2026-05-18T11:59:50.000Z'), now)).toBe('just now');
  });
  it('< 60s → Xs ago', () => {
    expect(formatRelative(new Date('2026-05-18T11:59:15.000Z'), now)).toBe('45s ago');
  });
  it('minutes range', () => {
    expect(formatRelative(new Date('2026-05-18T11:55:00.000Z'), now)).toBe('5m ago');
  });
  it('hours range', () => {
    expect(formatRelative(new Date('2026-05-18T10:00:00.000Z'), now)).toBe('2h ago');
  });
  it('days range', () => {
    expect(formatRelative(new Date('2026-05-15T12:00:00.000Z'), now)).toBe('3d ago');
  });
});
