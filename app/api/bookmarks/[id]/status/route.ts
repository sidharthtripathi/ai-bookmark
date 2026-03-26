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
      errorMessage: true,
      originalUrl: true,
      processedContent: {
        select: {
          title: true,
          thumbnailUrl: true,
          platform: true,
          resource: true,
          normalisedUrl: true,
        }
      }
    }
  });

  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: bookmark.id,
    status: bookmark.status,
    errorMessage: bookmark.errorMessage,
    originalUrl: bookmark.originalUrl,
    platform: bookmark.processedContent?.platform ?? null,
    resource: bookmark.processedContent?.resource ?? null,
    title: bookmark.processedContent?.title ?? null,
    thumbnailUrl: bookmark.processedContent?.thumbnailUrl ?? null,
  });
}
