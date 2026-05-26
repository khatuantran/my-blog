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
      <div className="flex items-center gap-2 p-4 font-mono text-mono text-tm">
        <AsciiSpinner /> loading users...
      </div>
    );
  }
  if (isError || !data) {
    return <div className="p-4 font-mono text-mono-sm text-red">// failed to load users</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-mono-sm">
        <thead className="border-b border-b1 text-mono-sm uppercase text-tm">
          <tr>
            <th className="px-4 py-2">Username</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Last seen</th>
            <th className="px-4 py-2">Posts</th>
            <th className="px-4 py-2 text-right">Actions</th>
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
                <td className="px-4 py-2">
                  <span
                    className="font-mono text-mono-sm"
                    style={{ color: u.role === 'ADMIN' ? '#00FFE5' : '#C9D1D9' }}
                  >
                    ~/{u.username}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className="rounded-[2px] px-1.5 py-0.5 font-mono text-mono-sm"
                    style={{
                      color: ROLE_COLOR[u.role],
                      border: `1px solid ${ROLE_COLOR[u.role]}50`,
                    }}
                  >
                    [ {u.role} ]
                  </span>
                </td>
                <td className="px-4 py-2 text-tm">{formatRelative(u.createdAt)}</td>
                <td className="px-4 py-2 text-tm">—</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    {u.role !== 'ADMIN' && (
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
                    <button
                      type="button"
                      aria-label={`View ${u.username}`}
                      className="rounded-sm border border-blu/50 px-2 py-0.5 font-mono text-mono-sm text-blu hover:bg-blu/10"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-tm">
                // no users
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
