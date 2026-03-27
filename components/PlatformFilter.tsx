'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const displayText = selected ? (LABELS[selected] ?? selected) : 'All Platforms';

  return (
    <Select value={selected || '__none__'} onValueChange={(v) => { if (v) onSelect(v === '__none__' ? '' : v); }}>
      <SelectTrigger className="w-[160px]">
        <SelectValue>{displayText}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">All Platforms</SelectItem>
        {platforms.map((p) => (
          <SelectItem key={p} value={p}>
            {LABELS[p] ?? p}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
