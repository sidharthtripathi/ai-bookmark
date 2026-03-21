'use client';

import { BookmarkCard } from './BookmarkCard';
import { ProcessingCard } from './ProcessingCard';

interface BookmarkGridProps {
  bookmarks: any[];
  onUpdate?: () => void;
}

export function BookmarkGrid({ bookmarks, onUpdate }: BookmarkGridProps) {
  const done = bookmarks.filter(b => b.status === 'done');
  const processing = bookmarks.filter(b => b.status === 'processing' || b.status === 'pending');
  const failed = bookmarks.filter(b => b.status === 'failed');

  return (
    <div className="space-y-8">
      {failed.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-red-600 mb-3">Failed ({failed.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failed.map(b => (
              <FailedCard key={b.id} bookmark={b} onDelete={onUpdate} />
            ))}
          </div>
        </div>
      )}

      {processing.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Processing ({processing.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processing.map(b => (
              <ProcessingCard key={b.id} bookmark={b} />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Saved ({done.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {done.map(b => (
              <BookmarkCard key={b.id} bookmark={b} onDelete={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FailedCard({ bookmark, onDelete }: any) {
  async function handleDelete() {
    await fetch(`/api/bookmarks/${bookmark.id}`, { method: 'DELETE' });
    onDelete?.();
  }

  return (
    <div className="bg-white rounded-lg border border-red-200 p-4">
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-red-50 rounded-lg flex items-center justify-center text-red-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-600">Failed to process</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bookmark.originalUrl}</p>
          {bookmark.errorMessage && (
            <p className="text-xs text-gray-400 mt-1">{bookmark.errorMessage}</p>
          )}
          <button
            onClick={handleDelete}
            className="mt-2 text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
