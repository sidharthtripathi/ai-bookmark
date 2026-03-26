import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// SSE endpoint that streams bookmark status updates
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Poll for bookmark status changes every 2 seconds
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          // Get bookmarks that are still processing or recently failed
          const activeBookmarks = await db.bookmark.findMany({
            where: {
              userId,
              status: { in: ['processing', 'pending', 'failed'] }
            },
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
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          });

          if (activeBookmarks.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'status_update', bookmarks: activeBookmarks })}\n\n`)
            );
          }
        } catch {
          // Ignore polling errors
        }
      }, 2000);

      // Clean up on close
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
        controller.close();
      });
    },
    cancel() {
      isClosed = true;
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
