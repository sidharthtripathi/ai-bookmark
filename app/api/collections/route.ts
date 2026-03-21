import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const collections = await db.collection.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { bookmarks: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, emoji } = body;

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const collection = await db.collection.create({
    data: {
      userId: session.user.id,
      name,
      description: description ?? null,
      emoji: emoji ?? null,
    }
  });

  return NextResponse.json(collection, { status: 201 });
}
