'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function CollectionPage() {
  const params = useParams();
  const id = params.id as string;
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-video rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {collection.emoji && <span className="text-3xl">{collection.emoji}</span>}
        <h2 className="text-2xl font-bold">{collection.name}</h2>
      </div>

      {collection.bookmarks?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No bookmarks in this collection</p>
        </div>
      ) : (
        <BookmarkGrid bookmarks={collection.bookmarks ?? []} />
      )}
    </div>
  );
}
