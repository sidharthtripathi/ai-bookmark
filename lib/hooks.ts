import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============= BOOKMARKS =============

export interface Bookmark {
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
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const BOOKMARKS_KEY = (filters?: { platform?: string; tags?: string[] }) => ['bookmarks', filters] as const;

async function fetchBookmarks(filters?: { platform?: string; tags?: string[] }): Promise<BookmarksResponse> {
  const params = new URLSearchParams();
  if (filters?.platform) params.set('platform', filters.platform);
  if (filters?.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));

  const res = await fetch(`/api/bookmarks?${params}`);
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  return res.json();
}

export function useBookmarks(filters?: { platform?: string; tags?: string[] }) {
  return useQuery({
    queryKey: BOOKMARKS_KEY(filters),
    queryFn: () => fetchBookmarks(filters),
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { url: string; personal_note?: string; collection_id?: string }) => {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || error.error || 'Failed to create bookmark');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete bookmark');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { personal_note?: string; collection_id?: string; add_tags?: string[]; remove_tags?: string[] } }) => {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update bookmark');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

// ============= COLLECTIONS =============

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  emoji?: string | null;
  isDefault: boolean;
  _count?: { bookmarks: number };
}

const COLLECTIONS_KEY = ['collections'] as const;

async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch('/api/collections');
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

export function useCollections() {
  return useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: fetchCollections,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; emoji?: string }) => {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; emoji?: string } }) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY });
    },
  });
}
