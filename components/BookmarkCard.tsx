'use client';

import { useState } from 'react';
import { PlatformBadge } from './PlatformBadge';

interface BookmarkCardProps {
  bookmark: {
    id: string;
    originalUrl: string;
    personalNote?: string | null;
    status: string;
    collection?: { id: string; name: string; emoji?: string | null } | null;
    processedContent: {
      title?: string | null;
      summary?: string | null;
      keyTopics?: string[];
      category?: string | null;
      contentType?: string | null;
      authorHandle?: string | null;
      thumbnailUrl?: string | null;
      platform: string;
      resource: string;
    };
  };
  onDelete?: () => void;
}

export function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { processedContent: pc } = bookmark;

  const effectiveCategory = bookmark.personalNote ?? pc.category ?? 'Other';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {pc.thumbnailUrl ? (
            <img
              src={pc.thumbnailUrl}
              alt=""
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <PlatformBadge platform={pc.platform} resource={pc.resource} size="lg" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PlatformBadge platform={pc.platform} resource={pc.resource} />
                {pc.contentType && <span className="text-xs text-gray-500">{pc.contentType}</span>}
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
                {pc.title ?? 'Untitled'}
              </h3>
              {pc.authorHandle && (
                <p className="text-xs text-gray-500 mt-0.5">{pc.authorHandle}</p>
              )}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <a
                    href={bookmark.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Open URL
                  </a>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete?.(); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {pc.summary && (
            <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{pc.summary}</p>
          )}

          {bookmark.personalNote && (
            <p className="text-xs text-blue-600 mt-1 italic">&ldquo;{bookmark.personalNote}&rdquo;</p>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            {(pc.keyTopics ?? []).slice(0, 3).map((topic: string) => (
              <span key={topic} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
