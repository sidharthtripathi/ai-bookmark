'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AddBookmarkForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/collections')
      .then(r => r.json())
      .then(data => setCollections(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, personal_note: note || undefined, collection_id: collectionId || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Failed to save bookmark');
        return;
      }

      setSuccess(true);
      setUrl('');
      setNote('');
      setCollectionId('');
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a URL..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Personal note (optional)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <select
          value={collectionId}
          onChange={e => setCollectionId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No collection</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>
              {c.emoji ? `${c.emoji} ` : ''}{c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Bookmark saved!</p>}

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving...' : 'Save Bookmark'}
      </button>
    </form>
  );
}
