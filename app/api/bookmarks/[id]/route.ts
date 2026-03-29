import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { deleteBookmarkVector } from '@/lib/pinecone';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const bookmark = await db.bookmark.findFirst({
    where: { id, userId: session.user.id },
    include: { processedContent: true, collection: { select: { id: true, name: true, emoji: true } } }
  });

  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(bookmark);
}

const MAX_FIELD_LENGTH = 10000;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { personal_note, collection_id, add_tags, remove_tags } = body;

  // Enforce field length limits
  if (personal_note !== undefined && personal_note !== null && personal_note.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: 'Personal note too long' }, { status: 400 });
  }

  // If collection_id is provided, verify it belongs to this user
  if (collection_id !== undefined && collection_id !== null) {
    const collection = await db.collection.findFirst({
      where: { id: collection_id, userId: session.user.id }
    });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
  }

  const bookmark = await db.bookmark.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Build update data
  const updateData: any = {
    personalNote: personal_note !== undefined ? personal_note : undefined,
    collectionId: collection_id !== undefined ? collection_id : undefined,
  };

  // Handle tag updates
  if (add_tags || remove_tags) {
    const currentTags = bookmark.tags ?? [];
    let newTags = currentTags;
    if (add_tags && Array.isArray(add_tags)) {
      newTags = [...new Set([...currentTags, ...add_tags])];
    }
    if (remove_tags && Array.isArray(remove_tags)) {
      newTags = newTags.filter(t => !remove_tags.includes(t));
    }
    updateData.tags = newTags;
  }

  const updated = await db.bookmark.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const bookmark = await db.bookmark.findFirst({
    where: { id, userId: session.user.id },
    include: { processedContent: { include: { bookmarks: { select: { id: true } } } } }
  });
  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const processedContentId = bookmark.processedContentId;
  const otherBookmarksCount = bookmark.processedContent.bookmarks.filter(b => b.id !== bookmark.id).length;

  await deleteBookmarkVector(id).catch(() => { /* ignore vector deletion errors */ });
  await db.bookmark.delete({ where: { id } });

  // If this was the last bookmark referencing this ProcessedContent, clean it up
  if (otherBookmarksCount === 0) {
    await db.processedContent.delete({ where: { id: processedContentId } }).catch(() => {
      // Ignore if already deleted (race condition)
    });
  }

  return NextResponse.json({ success: true });
}
