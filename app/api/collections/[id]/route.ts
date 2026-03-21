import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

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

  const collection = await db.collection.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

  await db.collection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
