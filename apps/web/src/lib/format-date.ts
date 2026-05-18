// Format date utilities cho post timestamps.

// Format theo design pattern `[2026-05-17 12:30]`.
export function formatTimestamp(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return `[${yyyy}-${mm}-${dd} ${HH}:${MM}]`;
}

// "2h ago" / "5m ago" / "3d ago" / "just now".
export function formatRelative(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 30) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
