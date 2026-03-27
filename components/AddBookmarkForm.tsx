'use client';

import { useState, memo } from 'react';
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
import { useCollections, useCreateCollection, useCreateBookmark } from '@/lib/hooks';

export const AddBookmarkForm = memo(function AddBookmarkForm() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const createCollection = useCreateCollection();
  const createBookmark = useCreateBookmark();

  // Auto-select default collection when collections load
  const selectedCollection = selectedCollectionId
    ? collections.find(c => c.id === selectedCollectionId)
    : collections.find(c => c.isDefault) ?? null;

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;

    try {
      await createCollection.mutateAsync({ name: newCollectionName.trim() });
      setNewCollectionName('');
      setShowCreateForm(false);
      toast.success('Collection created');
    } catch (error: any) {
      toast.error('Failed to create collection', { description: error.message });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      await createBookmark.mutateAsync({
        url,
        personal_note: note || undefined,
        collection_id: selectedCollection?.id || undefined,
      });

      toast('Bookmark saved', {
        description: 'Your bookmark is being processed with AI.',
      });

      setUrl('');
      setNote('');
      setSelectedCollectionId(null);
    } catch (error: any) {
      toast.error('Failed to save bookmark', {
        description: error.message,
      });
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              disabled={createCollection.isPending || !newCollectionName.trim()}
              onClick={handleCreateCollection}
            >
              {createCollection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
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
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-collection" className="sr-only">
            Collection
          </Label>
          <Select
            value={selectedCollection?.id ?? selectedCollectionId ?? '__none__'}
            onValueChange={(v) => {
              if (v === '__none__') {
                setSelectedCollectionId(null);
              } else if (v === '__create__') {
                setShowCreateForm(true);
              } else {
                setSelectedCollectionId(v);
              }
            }}
            disabled={collectionsLoading}
          >
            <SelectTrigger id="bookmark-collection" className="w-full">
              {selectedCollection ? (
                selectedCollection.name
              ) : (
                <span className="text-muted-foreground">General</span>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">General</SelectItem>
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
        disabled={createBookmark.isPending || !url.trim()}
      >
        {createBookmark.isPending ? (
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
});
