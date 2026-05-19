export type CommandGroup = 'recent' | 'navigate' | 'actions';

export type Command = {
  id: string;
  group: CommandGroup;
  icon: string;
  label: string;
  desc?: string;
  to: string;
  keys?: string[];
};

export const COMMANDS: Command[] = [
  {
    id: 'r-feed',
    group: 'recent',
    icon: '📡',
    label: 'Go to feed',
    desc: '~/feed',
    to: '/',
    keys: ['⌘', 'G'],
  },
  {
    id: 'r-search',
    group: 'recent',
    icon: '🔍',
    label: 'Search posts',
    desc: '~/search',
    to: '/search',
    keys: ['/'],
  },
  {
    id: 'r-create',
    group: 'recent',
    icon: '✏️',
    label: 'Create new post',
    desc: '~/admin/create',
    to: '/admin/create',
    keys: ['⌘', 'N'],
  },
  {
    id: 'n-feed',
    group: 'navigate',
    icon: '🏠',
    label: '~/feed',
    desc: 'Home feed',
    to: '/',
    keys: ['⌘', '1'],
  },
  {
    id: 'n-saved',
    group: 'navigate',
    icon: '🔖',
    label: '~/saved',
    desc: 'Saved posts',
    to: '/saved',
    keys: ['⌘', '2'],
  },
  {
    id: 'n-tags',
    group: 'navigate',
    icon: '🏷',
    label: '~/tags',
    desc: 'Browse tags',
    to: '/tags',
  },
  {
    id: 'n-profile',
    group: 'navigate',
    icon: '👤',
    label: '~/profile',
    desc: 'Your profile',
    to: '/me',
  },
  {
    id: 'n-search',
    group: 'navigate',
    icon: '⌕',
    label: '~/search',
    desc: 'Full-text search',
    to: '/search',
  },
  {
    id: 'n-admin',
    group: 'navigate',
    icon: '⚙️',
    label: '~/admin',
    desc: 'Admin dashboard',
    to: '/admin',
    keys: ['⌘', '3'],
  },
  { id: 'a-theme', group: 'actions', icon: '🌙', label: 'Toggle theme', to: '/', keys: ['⌘', 'T'] },
  {
    id: 'a-logout',
    group: 'actions',
    icon: '🚪',
    label: 'Logout',
    to: '/auth/login',
    keys: ['⌘', 'Q'],
  },
];

export function filterCommands(query: string): Command[] {
  if (!query) return COMMANDS;
  const q = query.toLowerCase();
  return COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.desc?.toLowerCase().includes(q),
  );
}

export function groupCommands(cmds: Command[]): { group: CommandGroup; items: Command[] }[] {
  const groups: CommandGroup[] = [];
  for (const c of cmds) if (!groups.includes(c.group)) groups.push(c.group);
  return groups.map((group) => ({ group, items: cmds.filter((c) => c.group === group) }));
}
