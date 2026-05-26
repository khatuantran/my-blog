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

// T-365 — 8-command palette per DESIGN_SYSTEM L237 + design-file v2 spec.
// navigate (5): Feed ⌘1 / Saved ⌘2 / Create Post ⌘N / Admin ⌘3 / Tags ⌘4
// actions (2): Toggle theme ⌘T / Logout ⌘Q
// recent: placeholder (no usage tracking yet — render `// no recent activity` row)
export const COMMANDS: Command[] = [
  // navigate group
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
    id: 'n-create',
    group: 'navigate',
    icon: '✏️',
    label: 'Create Post',
    desc: '~/admin/create',
    to: '/admin/create',
    keys: ['⌘', 'N'],
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
  {
    id: 'n-tags',
    group: 'navigate',
    icon: '🏷',
    label: '~/tags',
    desc: 'Browse tags',
    to: '/tags',
    keys: ['⌘', '4'],
  },
  // actions group
  {
    id: 'a-theme',
    group: 'actions',
    icon: '🌙',
    label: 'Toggle theme',
    to: '/',
    keys: ['⌘', 'T'],
  },
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

// Preserve display order: recent → navigate → actions. Recent group always rendered
// (placeholder shown when items empty + no query filter). Other groups hidden when empty.
export function groupCommands(
  cmds: Command[],
  hasQuery: boolean = false,
): { group: CommandGroup; items: Command[] }[] {
  const order: CommandGroup[] = ['recent', 'navigate', 'actions'];
  return order
    .map((group) => ({ group, items: cmds.filter((c) => c.group === group) }))
    .filter((g) => g.items.length > 0 || (g.group === 'recent' && !hasQuery));
}
