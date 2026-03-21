'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookmarkGrid } from '@/components/BookmarkGrid';

export default function CollectionPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollection() {
      const res = await fetch(`/api/collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data);
      }
      setLoading(false);
    }
    fetchCollection();
  }, [id]);

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!collection) return <div>Collection not found</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {collection.emoji && <span className="text-3xl">{collection.emoji}</span>}
        <h2 className="text-2xl font-bold">{collection.name}</h2>
        {collection.description && <p className="text-gray-500 text-sm">{collection.description}</p>}
      </div>

      {collection.bookmarks?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No bookmarks in this collection</p>
        </div>
      ) : (
        <BookmarkGrid bookmarks={collection.bookmarks ?? []} />
      )}
    </div>
  );
}
