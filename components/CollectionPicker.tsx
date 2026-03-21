'use client';

import { useEffect, useState } from 'react';

interface CollectionPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function CollectionPicker({ value, onChange }: CollectionPickerProps) {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/collections')
      .then(r => r.json())
      .then(data => setCollections(data))
      .catch(() => {});
  }, []);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">No collection</option>
      {collections.map(c => (
        <option key={c.id} value={c.id}>
          {c.emoji ? `${c.emoji} ` : ''}{c.name}
        </option>
      ))}
    </select>
  );
}
