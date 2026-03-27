'use client';

import { useState } from 'react';
import { MoreHorizontal, ExternalLink, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface BookmarkCardProps {
  bookmark: {
    id: string;
    originalUrl: string;
    personalNote?: string | null;
    status: string;
    tags?: string[];
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
  onUpdate?: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-100 text-red-700 hover:bg-red-100',
  twitter: 'bg-sky-100 text-sky-700 hover:bg-sky-100',
  instagram: 'bg-pink-100 text-pink-700 hover:bg-pink-100',
  reddit: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  web: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YT',
  twitter: 'X',
  instagram: 'IG',
  reddit: 'RD',
  web: 'Web',
};

export function BookmarkCard({ bookmark, onDelete, onUpdate }: BookmarkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { processedContent: pc } = bookmark;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        {/* Thumbnail or platform placeholder */}
        {pc.thumbnailUrl ? (
          <div className="aspect-video bg-muted overflow-hidden">
            <img
              src={pc.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center">
            <span className={`text-sm font-medium px-2 py-1 rounded ${PLATFORM_COLORS[pc.platform] ?? PLATFORM_COLORS.web}`}>
              {PLATFORM_LABELS[pc.platform] ?? 'Web'}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {/* Platform + content type */}
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {PLATFORM_LABELS[pc.platform] ?? pc.platform}
          </Badge>
          {pc.contentType && (
            <span className="text-xs text-muted-foreground">{pc.contentType}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">
          {pc.title ?? 'Untitled'}
        </h3>

        {/* Author */}
        {pc.authorHandle && (
          <p className="text-xs text-muted-foreground">{pc.authorHandle}</p>
        )}

        {/* Summary */}
        {pc.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{pc.summary}</p>
        )}

        {/* Personal note */}
        {bookmark.personalNote && (
          <p className="text-xs text-primary italic">&ldquo;{bookmark.personalNote}&rdquo;</p>
        )}

        {/* Tags (user tags + AI keyTopics) */}
        {(() => {
          const allTags = [...(bookmark.tags ?? []), ...(pc.keyTopics ?? [])];
          const uniqueTags = [...new Set(allTags)].slice(0, 5);
          if (uniqueTags.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-1">
              {uniqueTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        })()}

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {bookmark.collection && (
              <Badge variant="outline" className="text-xs">
                {bookmark.collection.emoji ? `${bookmark.collection.emoji} ` : ''}
                {bookmark.collection.name}
              </Badge>
            )}
          </div>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => window.open(bookmark.originalUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
