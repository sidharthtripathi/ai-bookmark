'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, MoreHorizontal, Trash2, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useCollections, useCreateCollection, useDeleteCollection, useUpdateCollection } from '@/lib/hooks';

export const CollectionSidebar = memo(function CollectionSidebar() {
  const pathname = usePathname();

  const { data: collections = [], isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const updateCollection = useUpdateCollection();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await createCollection.mutateAsync({ name: newName.trim() });
      setNewName('');
      setCreating(false);
      toast.success('Collection created');
    } catch (error: any) {
      toast.error('Failed to create collection', { description: error.message });
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !editingId) return;

    try {
      await updateCollection.mutateAsync({ id: editingId, data: { name: editName.trim() } });
      setEditingId(null);
      toast.success('Collection updated');
    } catch (error: any) {
      toast.error('Failed to update collection', { description: error.message });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCollection.mutateAsync(id);
      toast.success('Collection deleted');
    } catch (error: any) {
      toast.error('Failed to delete collection', { description: error.message });
    }
  }

  return (
    <>
      <div className="px-3 py-2 border-t">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Collections
          </h3>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" className="h-6 w-6" />
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Collection</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="collection-name">Name</Label>
                  <Input
                    id="collection-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My collection"
                    autoFocus
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCollection.isPending}>
                    {createCollection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-40">
          <div className="space-y-0.5">
            {isLoading && (
              <p className="text-xs text-muted-foreground px-2 py-1.5">Loading...</p>
            )}
            {!isLoading && collections.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1.5">
                No collections yet
              </p>
            )}
            {collections.map((c) => {
              const href = `/collections/${c.id}`;
              const active = pathname === href;
              return (
                <div
                  key={c.id}
                  className={cn(
                    'group flex items-center justify-between rounded-md px-2 py-1.5 text-sm',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <Link href={href} className="flex-1 truncate">
                    {c.name}
                    {(c._count?.bookmarks ?? 0) > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground/60">
                        {c._count?.bookmarks}
                      </span>
                    )}
                  </Link>

                  {!c.isDefault && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        }
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(c.id);
                            setEditName(c.name);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(c.id)}
                          disabled={deleteCollection.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(v) => !v && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCollection.isPending}>
                {updateCollection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
});
