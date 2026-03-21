import { db } from '../lib/db';
import { upsertBookmarkVector } from '../lib/pinecone';

export async function handlePineconeUpsertJob(bookmarkId: string, processedContentId: string) {
  const bookmark = await db.bookmark.findUnique({
    where: { id: bookmarkId },
    include: { processedContent: true }
  });
  if (!bookmark) throw new Error(`Bookmark ${bookmarkId} not found`);
  if (!bookmark.processedContent.embeddingValues) throw new Error('No embedding values found');
  if (!bookmark.processedContent.category) throw new Error('ProcessedContent not fully processed yet');

  await upsertBookmarkVector(
    bookmark.id,
    bookmark.userId,
    bookmark.processedContent.platform,
    bookmark.processedContent.resource,
    bookmark.processedContent.category,
    bookmark.collectionId ?? null,
    bookmark.processedContent.embeddingValues
  );
}
