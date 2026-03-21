'use client';

import { useState } from 'react';
import { BookmarkCard } from './BookmarkCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookmarkGridProps {
  bookmarks: any[];
  onUpdate?: () => void;
}

export function BookmarkGrid({ bookmarks, onUpdate }: BookmarkGridProps) {
  const done = bookmarks.filter((b) => b.status === 'done');
  const processing = bookmarks.filter(
    (b) => b.status === 'processing' || b.status === 'pending'
  );
  const failed = bookmarks.filter((b) => b.status === 'failed');

  if (bookmarks.length === 0) {
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
      {failed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-medium text-destructive">
              Failed ({failed.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {failed.map((b) => (
              <FailedCard
                key={b.id}
                bookmark={b}
                onDelete={onUpdate}
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

function FailedCard({ bookmark, onDelete }: { bookmark: any; onDelete?: () => void }) {
  async function handleDelete() {
    await fetch(`/api/bookmarks/${bookmark.id}`, { method: 'DELETE' });
    onDelete?.();
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Failed to process</p>
            <p className="text-xs text-muted-foreground line-clamp-2 break-all">
              {bookmark.originalUrl}
            </p>
            {bookmark.errorMessage && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {bookmark.errorMessage}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </CardContent>
    </Card>
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
