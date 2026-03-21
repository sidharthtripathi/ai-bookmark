interface PlatformBadgeProps {
  platform: string;
  resource: string;
  size?: 'sm' | 'lg';
}

const CONFIG: Record<string, { color: string; label: string; abbr: string }> = {
  youtube: { color: 'bg-red-100 text-red-700', label: 'YouTube', abbr: 'YT' },
  twitter: { color: 'bg-sky-100 text-sky-700', label: 'Twitter/X', abbr: 'X' },
  instagram: { color: 'bg-pink-100 text-pink-700', label: 'Instagram', abbr: 'IG' },
  reddit: { color: 'bg-orange-100 text-orange-700', label: 'Reddit', abbr: 'RD' },
  web: { color: 'bg-gray-100 text-gray-700', label: 'Web', abbr: 'Web' },
};

export function PlatformBadge({ platform, resource, size = 'sm' }: PlatformBadgeProps) {
  const config = CONFIG[platform] ?? CONFIG.web;
  const isLg = size === 'lg';

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${config.color} ${isLg ? 'px-3 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'}`}
      title={config.label}
    >
      {config.abbr}
    </span>
  );
}
