'use client';

interface PlatformFilterProps {
  platforms: string[];
  selected: string;
  onSelect: (platform: string) => void;
}

const LABELS: Record<string, string> = {
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  reddit: 'Reddit',
  web: 'Web',
};

export function PlatformFilter({ platforms, selected, onSelect }: PlatformFilterProps) {
  return (
    <select
      value={selected}
      onChange={e => onSelect(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Platforms</option>
      {platforms.map(p => (
        <option key={p} value={p}>{LABELS[p] ?? p}</option>
      ))}
    </select>
  );
}
