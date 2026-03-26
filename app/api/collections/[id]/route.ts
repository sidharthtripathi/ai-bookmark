import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const collection = await db.collection.findFirst({
    where: { id, userId: session.user.id },
    include: {
      bookmarks: {
        include: { processedContent: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(collection);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, emoji } = body;

  // Enforce field length limits
  if (name !== undefined && name !== null && name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MAX_NAME_LENGTH} characters or less` }, { status: 400 });
  }
  if (description !== undefined && description !== null && description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` }, { status: 400 });
  }

  const collection = await db.collection.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent modifying the default collection
  if (collection.isDefault) {
    return NextResponse.json({ error: 'Cannot modify the default collection' }, { status: 403 });
  }

  const updated = await db.collection.update({
    where: { id },
    data: {
      name: name ?? collection.name,
      description: description !== undefined ? description : collection.description,
      emoji: emoji !== undefined ? emoji : collection.emoji,
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const collection = await db.collection.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent deleting the default collection
  if (collection.isDefault) {
    return NextResponse.json({ error: 'Cannot delete the default collection' }, { status: 403 });
  }

  await db.collection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
