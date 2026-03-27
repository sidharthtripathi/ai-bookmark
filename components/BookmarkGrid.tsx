'use client';

import { useState, useEffect } from 'react';
import { BookmarkCard } from './BookmarkCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteBookmark, useUpdateBookmark } from '@/lib/hooks';

interface BookmarkGridProps {
  bookmarks: any[];
  onUpdate?: () => void;
}

export function BookmarkGrid({ bookmarks, onUpdate }: BookmarkGridProps) {
  const [liveFailed, setLiveFailed] = useState<any[]>([]);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const deleteBookmark = useDeleteBookmark();
  const updateBookmark = useUpdateBookmark();

  useEffect(() => {
    const es = new EventSource('/api/bookmarks/stream');

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'status_update' && data.bookmarks) {
          const failed = data.bookmarks.filter((b: any) => b.status === 'failed');
          setLiveFailed(failed);
        }
      } catch {}
    };

    return () => es.close();
  }, []);

  const done = bookmarks.filter((b) => b.status === 'done');
  const processing = bookmarks.filter(
    (b) => b.status === 'processing' || b.status === 'pending'
  );
  const failed = bookmarks.filter((b) => b.status === 'failed');
  const allFailed = [...failed];
  liveFailed.forEach(lf => {
    if (!allFailed.find(f => f.id === lf.id)) {
      allFailed.push(lf);
    }
  });

  if (bookmarks.length === 0 && liveFailed.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-8">
      {allFailed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-medium text-destructive">
              Failed ({allFailed.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allFailed.map((b) => (
              <FailedCard
                key={b.id}
                bookmark={b}
                onDelete={onUpdate}
                isRetrying={retryingIds.has(b.id)}
                onRetry={async (id) => {
                  setRetryingIds(prev => new Set(prev).add(id));
                  try {
                    await fetch(`/api/bookmarks/${id}/retry`, { method: 'POST' });
                    onUpdate?.();
                  } finally {
                    setRetryingIds(prev => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {processing.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Processing ({processing.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processing.map((b) => (
              <ProcessingCardSkeleton key={b.id} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Saved ({done.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {done.map((b) => (
              <BookmarkCard
                key={b.id}
                bookmark={b}
                onDelete={onUpdate}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FailedCard({
  bookmark,
  onDelete,
  isRetrying,
  onRetry,
}: {
  bookmark: any;
  onDelete?: () => void;
  isRetrying?: boolean;
  onRetry?: (id: string) => void;
}) {
  const deleteBookmark = useDeleteBookmark();

  async function handleDelete() {
    await deleteBookmark.mutateAsync(bookmark.id);
    onDelete?.();
  }

  const friendlyMessage = getFriendlyErrorMessage(bookmark.errorMessage);

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Processing failed</p>
            <p className="text-xs text-muted-foreground line-clamp-2 break-all">
              {bookmark.originalUrl}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              {friendlyMessage}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleteBookmark.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Discard
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onRetry?.(bookmark.id)}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getFriendlyErrorMessage(errorMessage: string | null | undefined): string {
  if (!errorMessage) return 'Something went wrong. You can retry or discard this bookmark.';
  const msg = errorMessage.toLowerCase();
  if (msg.includes('instagram') && (msg.includes('not found') || msg.includes('empty'))) {
    return 'This Instagram content is unavailable or private.';
  }
  if (msg.includes('twitter') || msg.includes('x.com')) {
    return 'This tweet/post is unavailable, private, or was deleted.';
  }
  if (msg.includes('youtube') && (msg.includes('not found') || msg.includes('private'))) {
    return 'This YouTube video is unavailable or private.';
  }
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'Too many requests. Please wait a moment and retry.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return 'Network error. Check your connection and retry.';
  }
  if (msg.includes('apify')) {
    return 'Scraper service is temporarily unavailable. Please retry.';
  }
  if (msg.includes('ssrf') || msg.includes('unsafe')) {
    return 'This URL could not be processed for security reasons.';
  }
  return 'Something went wrong. You can retry or discard this bookmark.';
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
