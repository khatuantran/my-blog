import { useUsersList } from '@/hooks/queries/use-users-list';
import { useToggleBan } from '@/hooks/mutations/use-ban-user';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { formatRelative } from '@/lib/format-date';
import type { Role } from '@/types/api';

const ROLE_COLOR: Record<Role, string> = {
  ADMIN: '#FF9E64',
  USER: '#A0AEC0',
  BANNED: '#F7768E',
};

export function UsersTable() {
  const { data, isLoading, isError } = useUsersList({ limit: 20 });
  const m = useToggleBan();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 font-mono text-mono text-tm">
        <AsciiSpinner /> loading users...
      </div>
    );
  }
  if (isError || !data) {
    return <div className="font-mono text-mono-sm text-red">// failed to load users</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-b2 bg-surf">
      <table className="w-full text-left font-mono text-mono-sm">
        <thead className="border-b border-b1 text-mono-sm uppercase text-tm">
          <tr>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Joined</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((u) => {
            const banned = u.role === 'BANNED';
            return (
              <tr
                key={u.id}
                className={`border-t border-b1 hover:bg-elev ${banned ? 'opacity-60' : ''}`}
                data-testid={`user-row-${u.username}`}
              >
                <td className="px-3 py-2 text-blu">~/{u.username}</td>
                <td className="px-3 py-2">
                  <span
                    className="rounded-sm px-1.5 py-0.5 font-mono text-mono-sm"
                    style={{
                      color: ROLE_COLOR[u.role],
                      border: `1px solid ${ROLE_COLOR[u.role]}50`,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-2 text-tm">{formatRelative(u.createdAt)}</td>
                <td className="px-3 py-2 text-tm">{u.email ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  {u.role === 'ADMIN' ? (
                    <span className="text-mono-sm text-td">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => m.mutate({ userId: u.id, banned })}
                      disabled={m.isPending}
                      aria-label={banned ? `Unban ${u.username}` : `Ban ${u.username}`}
                      className={`rounded-sm border px-2 py-0.5 font-mono text-mono-sm transition-colors disabled:opacity-50 ${
                        banned
                          ? 'border-grn/50 text-grn hover:bg-grn/10'
                          : 'border-red/50 text-red hover:bg-red/10'
                      }`}
                    >
                      {banned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-tm">
                // no users
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
