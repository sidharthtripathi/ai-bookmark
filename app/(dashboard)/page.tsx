'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { PlatformFilter } from '@/components/PlatformFilter';
import { Tag, X } from 'lucide-react';
import { useBookmarks } from '@/lib/hooks';

const PLATFORMS = ['youtube', 'twitter', 'instagram', 'reddit', 'web'];

function DashboardPageComponent() {
  const [platform, setPlatform] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Build query filters - stable reference to prevent unnecessary refetches
  const filters = useMemo(() => ({
    platform: platform || undefined,
    tags: activeTags.length > 0 ? activeTags : undefined,
  }), [platform, activeTags]);

  const { data, isLoading, refetch } = useBookmarks(filters);
  const bookmarks = data?.bookmarks ?? [];

  // Handle tag input - space creates a tag, enter to search
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!activeTags.includes(newTag)) {
        setActiveTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && activeTags.length > 0) {
      setActiveTags(prev => prev.slice(0, -1));
    }
  }, [tagInput, activeTags]);

  const removeTag = useCallback((tag: string) => {
    setActiveTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handlePlatformChange = useCallback((value: string) => {
    setPlatform(value);
  }, []);

  // SSE for live processing status updates
  const handleUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All Bookmarks</h2>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <PlatformFilter platforms={PLATFORMS} selected={platform} onSelect={handlePlatformChange} />

        {/* Tag input with token display */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap items-center gap-1 pl-9 pr-8 py-1.5 border rounded-md bg-background min-h-[42px]">
            {activeTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={activeTags.length === 0 ? "Type tag + space..." : "Add another..."}
              className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search results info */}
      {activeTags.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing bookmarks tagged with: {activeTags.map(t => `"${t}"`).join(', ')}
        </p>
      )}

      {/* Always render BookmarkGrid - it handles its own loading state internally */}
      <BookmarkGrid bookmarks={bookmarks} isLoading={isLoading} onUpdate={handleUpdate} />
    </div>
  );
}

// Memoize to prevent re-renders when parent doesn't need to update
export const DashboardPage = memo(DashboardPageComponent);

// Default export for Next.js page routing
export default DashboardPage;
