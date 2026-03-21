'use client';

import { useEffect, useState } from 'react';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlatformFilter } from '@/components/PlatformFilter';

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
          {[1,2,3,4,5,6].map(i => <ProcessingCard key={i} />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No bookmarks yet</p>
          <p className="text-sm">Paste a URL in the sidebar to save your first bookmark</p>
        </div>
      ) : (
        <BookmarkGrid bookmarks={bookmarks} onUpdate={fetchBookmarks} />
      )}
    </div>
  );
}

function ProcessingCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}
