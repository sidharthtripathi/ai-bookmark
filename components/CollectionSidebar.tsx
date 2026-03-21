'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CollectionSidebar() {
  const pathname = usePathname();
  const [collections, setCollections] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    const res = await fetch('/api/collections');
    const data = await res.json();
    setCollections(data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji || undefined }),
    });
    setNewName('');
    setNewEmoji('');
    setCreating(false);
    fetchCollections();
  }

  return (
    <div className="px-4 py-2 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Collections</h3>
        <button
          onClick={() => setCreating(!creating)}
          className="text-xs text-blue-600 hover:underline"
        >
          + New
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-2 space-y-1">
          <input
            type="text"
            value={newEmoji}
            onChange={e => setNewEmoji(e.target.value)}
            placeholder="Emoji (optional)"
            maxLength={2}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Collection name"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-1">
            <button type="submit" className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
              Create
            </button>
            <button type="button" onClick={() => setCreating(false)} className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {collections.length === 0 && !creating && (
          <p className="text-xs text-gray-400 px-2 py-1">No collections yet</p>
        )}
        {collections.map(c => {
          const href = `/collections/${c.id}`;
          const active = pathname === href;
          return (
            <Link
              key={c.id}
              href={href}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>
                {c.emoji ? `${c.emoji} ` : ''}{c.name}
              </span>
              {c._count?.bookmarks > 0 && (
                <span className="text-gray-400">{c._count.bookmarks}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
