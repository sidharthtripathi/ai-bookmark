'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchBookmarks();
  }, [category, platform]);

  async function fetchBookmarks() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (platform) params.set('platform', platform);

    const res = await fetch(`/api/bookmarks?${params}`);
    const data = await res.json();
    setBookmarks(data.bookmarks ?? []);
    setLoading(false);
  }

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
            <ProcessingCard key={i} />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-1">No bookmarks yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Paste a URL in the sidebar to save your first bookmark
          </p>
        </div>
      ) : (
        <BookmarkGrid bookmarks={bookmarks} onUpdate={fetchBookmarks} />
      )}
    </div>
  );
}

function ProcessingCard() {
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
