'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { SearchBar } from '@/components/SearchBar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/bookmarks/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.bookmarks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Search Bookmarks</h2>
      <SearchBar value={query} onChange={setQuery} placeholder="Search by meaning, not keywords..." />

      {loading && <p className="mt-4 text-muted-foreground">Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <div className="mt-8 text-center text-muted-foreground">
          <p>No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm mt-1">Try different words that describe what you&apos;re looking for</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <BookmarkGrid bookmarks={results} />
        </div>
      )}
    </div>
  );
}
