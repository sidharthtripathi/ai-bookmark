import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';
import { searchBookmarks } from '@/lib/pinecone';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  const category = searchParams.get('category') ?? undefined;
  const platform = searchParams.get('platform') ?? undefined;
  const resource = searchParams.get('resource') ?? undefined;
  const collectionId = searchParams.get('collectionId') ?? undefined;

  const queryEmbedding = await generateEmbedding({
    title: q,
    summary: '',
    searchableContext: q,
  });
  const matches = await searchBookmarks(session.user.id, queryEmbedding, { category, platform, resource, collectionId });

  if (!matches.length) return NextResponse.json({ bookmarks: [] });

  const bookmarkIds = matches.map(m => m.id);
  const bookmarkRecords = await db.bookmark.findMany({
    where: { id: { in: bookmarkIds } },
    include: { processedContent: true, collection: { select: { id: true, name: true, emoji: true } } }
  });

  // Preserve Pinecone score order
  const ordered = bookmarkIds.map(id => bookmarkRecords.find(b => b.id === id)).filter(Boolean);
  return NextResponse.json({ bookmarks: ordered });
}
