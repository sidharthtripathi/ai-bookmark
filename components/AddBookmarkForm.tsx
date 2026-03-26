'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, StickyNote, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [selectedCollection, setSelectedCollection] = useState<{ id: string; name: string; isDefault?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

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

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setCreatingCollection(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Failed to create collection', { description: data.error });
        return;
      }
      setCollections(prev => [data, ...prev]);
      setSelectedCollection(data);
      setNewCollectionName('');
      setShowCreateForm(false);
      toast.success('Collection created');
    } catch {
      toast.error('Failed to create collection');
    } finally {
      setCreatingCollection(false);
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
          collection_id: selectedCollection?.id || undefined,
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
      setSelectedCollection(null);
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

      {showCreateForm ? (
        <form onSubmit={handleCreateCollection} className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className="flex-1"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              disabled={creatingCollection || !newCollectionName.trim()}
            >
              {creatingCollection ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false);
                setNewCollectionName('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-collection" className="sr-only">
            Collection
          </Label>
          <Select
            value={selectedCollection?.id ?? '__none__'}
            onValueChange={(v) => {
              if (v === '__none__') {
                setSelectedCollection(null);
              } else if (v === '__create__') {
                setShowCreateForm(true);
              } else {
                const col = collections.find(c => c.id === v);
                if (col) setSelectedCollection(col);
              }
            }}
          >
            <SelectTrigger id="bookmark-collection" className="w-full">
              {selectedCollection ? (
                selectedCollection.name
              ) : (
                <span className="text-muted-foreground">No collection</span>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No collection</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              <SelectItem value="__create__">
                <span className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Create new collection
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
