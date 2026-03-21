import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const bookmark = await db.bookmark.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      status: true,
      processedContent: { select: { title: true, thumbnailUrl: true } }
    }
  });

  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: bookmark.id,
    status: bookmark.status,
    title: bookmark.processedContent?.title ?? null,
    thumbnailUrl: bookmark.processedContent?.thumbnailUrl ?? null,
  });
}
