type Props = {
  icon: string;
  message: string;
  color: string;
  time: string;
};

// Activity log row: icon (color) + message + relative time.
// Match design-file/MyBlog Admin.html ACTIVITY_LOG section.
export function ActivityLogItem({ icon, message, color, time }: Props) {
  return (
    <div className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 transition-colors hover:bg-elev">
      <span className="text-sm" style={{ color }}>
        {icon}
      </span>
      <span className="flex-1 truncate font-mono text-mono-sm text-tp">{message}</span>
      <span className="shrink-0 font-mono text-mono-sm text-tm">{time}</span>
    </div>
  );
}
