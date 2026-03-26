'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlatformFilter } from '@/components/PlatformFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORIES = ['Technology', 'Science', 'Health', 'Finance', 'Business', 'Design', 'Education', 'Entertainment', 'News', 'Food', 'Travel', 'Sports', 'Philosophy', 'History', 'Art', 'Other'];
const PLATFORMS = ['youtube', 'twitter', 'instagram', 'reddit', 'web'];

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');

  const fetchBookmarks = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (platform) params.set('platform', platform);

    const res = await fetch(`/api/bookmarks?${params}`);
    const data = await res.json();
    setBookmarks(data.bookmarks ?? []);
    setLoading(false);
  }, [category, platform]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // SSE for live processing status updates
  useEffect(() => {
    const es = new EventSource('/api/bookmarks/stream');

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'status_update' && data.bookmarks) {
          // Check if any bookmark changed status - if so, refresh the list
          const hasChanges = data.bookmarks.some((updated: any) => {
            const existing = bookmarks.find(b => b.id === updated.id);
            return existing && existing.status !== updated.status;
          });
          if (hasChanges || data.bookmarks.some((b: any) => b.status === 'done')) {
            fetchBookmarks();
          }
        }
      } catch {}
    };

    return () => es.close();
  }, [bookmarks, fetchBookmarks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All Bookmarks</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <CategoryFilter categories={CATEGORIES} selected={category} onSelect={setCategory} />
        <PlatformFilter platforms={PLATFORMS} selected={platform} onSelect={setPlatform} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProcessingCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <BookmarkGrid bookmarks={bookmarks} onUpdate={fetchBookmarks} />
      )}
    </div>
  );
}

function ProcessingCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="aspect-video rounded-none" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
