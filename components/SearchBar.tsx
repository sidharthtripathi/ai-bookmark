'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSearch, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative max-w-2xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        placeholder={placeholder}
        className="pl-9 pr-24 text-lg"
      />
      <Button
        onClick={onSearch}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-4"
        size="sm"
      >
        Search
      </Button>
    </div>
  );
}
