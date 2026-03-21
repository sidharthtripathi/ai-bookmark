'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, StickyNote, FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function AddBookmarkForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data);
    } catch {
      // silently fail
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          personal_note: note || undefined,
          collection_id: collectionId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error('Failed to save bookmark', {
          description: data.message || data.error || 'Something went wrong',
        });
        return;
      }

      toast('Bookmark saved', {
        description: 'Your bookmark is being processed with AI.',
      });

      setUrl('');
      setNote('');
      setCollectionId(null);
      router.refresh();
    } catch {
      toast.error('Error', {
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="bookmark-url" className="sr-only">
          URL
        </Label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="bookmark-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a URL..."
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bookmark-note" className="sr-only">
          Personal Note
        </Label>
        <div className="relative">
          <StickyNote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="bookmark-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Personal note (optional)"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bookmark-collection" className="sr-only">
          Collection
        </Label>
        <Select value={collectionId ?? '__none__'} onValueChange={(v) => setCollectionId(v === '__none__' ? null : v)}>
          <SelectTrigger id="bookmark-collection" className="w-full">
            <SelectValue placeholder="No collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No collection</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.emoji ? `${c.emoji} ` : ''}
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !url.trim()}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Bookmark'
        )}
      </Button>
    </form>
  );
}
