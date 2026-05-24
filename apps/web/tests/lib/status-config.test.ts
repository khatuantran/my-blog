import { describe, expect, it } from 'vitest';
import { POST_STATUS_CFG, POST_STATUS_KEYS, type PostStatus } from '@/lib/status-config';

describe('status-config', () => {
  it('POST_STATUS_CFG có đủ 3 status với color đúng spec DESIGN_SYSTEM:431-433', () => {
    expect(POST_STATUS_CFG.PUBLISHED).toEqual({ label: 'PUBLISHED', color: '#9ECE6A' });
    expect(POST_STATUS_CFG.DRAFT).toEqual({ label: 'DRAFT', color: '#E0AF68' });
    expect(POST_STATUS_CFG.ARCHIVED).toEqual({ label: 'ARCHIVED', color: '#566176' });
  });

  it('POST_STATUS_KEYS có length=3 + cover tất cả Record key', () => {
    expect(POST_STATUS_KEYS).toHaveLength(3);
    const cfgKeys = Object.keys(POST_STATUS_CFG) as PostStatus[];
    for (const k of cfgKeys) {
      expect(POST_STATUS_KEYS).toContain(k);
    }
  });
});
