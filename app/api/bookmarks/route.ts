import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { processRawInput } from '@/lib/url-pipeline';
import { enqueueProcessing, enqueuePineconeUpsert } from '@/lib/queue';

const MAX_LIMIT = 100;
const MAX_FIELD_LENGTH = 10000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  const resource = searchParams.get('resource');
  const status = searchParams.get('status');
  const tags = searchParams.get('tags'); // comma-separated tags for OR logic
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20));
  const skip = (page - 1) * limit;

  const where: any = { userId: session.user.id };
  if (status) where.status = status;
  if (platform) where.processedContent = { platform };
  if (resource) where.processedContent = { ...where.processedContent, resource };
  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      where.tags = { hasSome: tagArray };
    }
  }

  const [bookmarks, total] = await Promise.all([
    db.bookmark.findMany({
      where,
      include: { processedContent: true, collection: { select: { id: true, name: true, emoji: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.bookmark.count({ where })
  ]);

  return NextResponse.json({ bookmarks, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { url, personal_note, collection_id } = body;

  if (!url) return NextResponse.json({ error: 'no_url_found', message: 'No valid URL detected in your input.' }, { status: 400 });

  // Enforce field length limits to prevent DoS
  if (url.length > 2000 || (personal_note && personal_note.length > MAX_FIELD_LENGTH)) {
    return NextResponse.json({ error: 'Input too long' }, { status: 400 });
  }

  const classified = await processRawInput(url);
  if (!classified.valid) {
    return NextResponse.json({ error: 'unsupported_url', message: classified.reason }, { status: 400 });
  }

  // If collection_id is provided, verify it belongs to this user (authorization check)
  // Otherwise, use the user's default "General" collection
  let finalCollectionId: string | null = null;
  if (collection_id) {
    const collection = await db.collection.findFirst({
      where: { id: collection_id, userId: session.user.id }
    });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    finalCollectionId = collection_id;
  } else {
    // Find the user's default collection
    const defaultCollection = await db.collection.findFirst({
      where: { userId: session.user.id, isDefault: true }
    });
    finalCollectionId = defaultCollection?.id ?? null;
  }

  // Check for existing bookmark (user-level deduplication)
  const existing = await db.bookmark.findFirst({
    where: { userId: session.user.id, processedContent: { normalisedUrl: classified.normalised } }
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status });
  }

  // Cache lookup — find or create ProcessedContent
  // IMPORTANT: Only reuse successfully processed content.
  // Failed/pending content is NOT reused across users — create fresh to allow retry.
  const cachedContent = await db.processedContent.findUnique({
    where: { normalisedUrl: classified.normalised }
  });

  const shouldReuse = cachedContent && cachedContent.status === 'done';

  // Create bookmark with cached content or fresh content
  const contentId = shouldReuse
    ? cachedContent!.id
    : (await db.processedContent.create({
        data: {
          normalisedUrl: classified.normalised,
          platform: classified.platform,
          resource: 'resource' in classified ? (classified as any).resource : 'article',
          status: 'pending',
        }
      })).id;

  if (!shouldReuse) {
    await enqueueProcessing(contentId);
  }

  // Create bookmark
  const bookmark = await db.bookmark.create({
    data: {
      userId: session.user.id,
      processedContentId: contentId,
      originalUrl: url,
      personalNote: personal_note ?? null,
      collectionId: finalCollectionId,
      status: shouldReuse ? 'done' : 'processing',
    }
  });

  // If reusing done content, still need to upsert the Pinecone vector for this bookmark
  if (shouldReuse && cachedContent!.embeddingValues) {
    await enqueuePineconeUpsert(bookmark.id, contentId);
  }

  return NextResponse.json({ id: bookmark.id, status: bookmark.status }, { status: 201 });
}
