// Mock activity log — port từ design-file/MyBlog Admin.html ACTIVITY_LOG.
// TODO: wire to GET /admin/activity sau M11 (T-042 currently deferred).

export type ActivityEntry = {
  id: string;
  icon: string;
  message: string;
  time: string;
  color: string;
};

export const ACTIVITY_LOG_MOCK: ActivityEntry[] = [
  { id: 'a1', icon: '❤', message: '@user1 liked post #abc123', time: '2m ago', color: '#FF6E96' },
  {
    id: 'a2',
    icon: '💬',
    message: 'Anon#7 commented on #xyz789',
    time: '5m ago',
    color: '#7DCFFF',
  },
  { id: 'a3', icon: '🔖', message: '@user2 saved post #abc123', time: '12m ago', color: '#E0AF68' },
  { id: 'a4', icon: '❤', message: '@user3 liked post #def456', time: '18m ago', color: '#FF6E96' },
  {
    id: 'a5',
    icon: '👤',
    message: 'New anonymous session Anon#11',
    time: '22m ago',
    color: '#BB9AF7',
  },
  {
    id: 'a6',
    icon: '💬',
    message: '@user1 commented on #def456',
    time: '25m ago',
    color: '#7DCFFF',
  },
];
