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

const VALID_CATEGORIES = [
  'Technology', 'Science', 'Health', 'Finance', 'Business', 'Design',
  'Education', 'Entertainment', 'News', 'Food', 'Travel', 'Sports',
  'Philosophy', 'History', 'Art', 'Other'
];
const MAX_FIELD_LENGTH = 10000;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { personal_note, category_override, collection_id } = body;

  // Enforce field length limits
  if (personal_note !== undefined && personal_note !== null && personal_note.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: 'Personal note too long' }, { status: 400 });
  }

  // Validate category_override against allowed values
  if (category_override !== undefined && category_override !== null) {
    if (!VALID_CATEGORIES.includes(category_override)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }
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

  const updated = await db.bookmark.update({
    where: { id },
    data: {
      personalNote: personal_note !== undefined ? personal_note : undefined,
      categoryOverride: category_override !== undefined ? category_override : undefined,
      collectionId: collection_id !== undefined ? collection_id : undefined,
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const bookmark = await db.bookmark.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteBookmarkVector(id);
  await db.bookmark.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
