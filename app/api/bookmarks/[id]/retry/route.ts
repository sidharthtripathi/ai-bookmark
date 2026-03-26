import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { enqueueProcessing } from '@/lib/queue';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const bookmark = await db.bookmark.findFirst({
    where: { id, userId: session.user.id },
    include: { processedContent: true }
  });

  if (!bookmark) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Can only retry failed or processing (stuck) bookmarks
  if (bookmark.status === 'done') {
    return NextResponse.json({ error: 'Bookmark already processed' }, { status: 400 });
  }

  // Create a fresh ProcessedContent for retry (don't reuse failed content)
  const newProcessedContent = await db.processedContent.create({
    data: {
      normalisedUrl: bookmark.processedContent.normalisedUrl,
      platform: bookmark.processedContent.platform,
      resource: bookmark.processedContent.resource,
      status: 'pending',
    }
  });

  // Link bookmark to new ProcessedContent
  await db.bookmark.update({
    where: { id: bookmark.id },
    data: {
      processedContentId: newProcessedContent.id,
      status: 'processing',
      errorMessage: null,
    }
  });

  // Update old ProcessedContent to mark it as superseded (cleanup later)
  await db.processedContent.update({
    where: { id: bookmark.processedContent.id },
    data: { status: 'superseded' }
  });

  // Enqueue the new processing job
  await enqueueProcessing(newProcessedContent.id);

  return NextResponse.json({ id: bookmark.id, status: 'processing', message: 'Retry enqueued' });
}
