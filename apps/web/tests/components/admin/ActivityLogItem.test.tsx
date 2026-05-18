import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityLogItem } from '@/components/admin/ActivityLogItem';
import { ACTIVITY_LOG_MOCK } from '@/mocks/activity-log';

describe('ActivityLogItem', () => {
  it('renders icon + message + time', () => {
    render(
      <ActivityLogItem icon="❤" message="@user1 liked post #abc" color="#FF6E96" time="2m ago" />,
    );
    expect(screen.getByText('❤')).toBeInTheDocument();
    expect(screen.getByText('@user1 liked post #abc')).toBeInTheDocument();
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });
});

describe('ACTIVITY_LOG_MOCK', () => {
  it('có ít nhất 6 entries (cover like/comment/save/anon session)', () => {
    expect(ACTIVITY_LOG_MOCK.length).toBeGreaterThanOrEqual(6);
  });
  it('mỗi entry có id unique', () => {
    const ids = ACTIVITY_LOG_MOCK.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
