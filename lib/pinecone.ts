import { Pinecone } from '@pinecone-database/pinecone';

function getIndex() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  return pc.index(process.env.PINECONE_INDEX!);
}

export async function upsertBookmarkVector(
  bookmarkId: string,
  userId: string,
  platform: string,
  resource: string,
  category: string,
  collectionId: string | null,
  embedding: number[]
) {
  const index = getIndex();
  await index.upsert({
    records: [{
      id: bookmarkId,
      values: embedding,
      metadata: { userId, platform, resource, category, collectionId: collectionId ?? '' }
    }]
  });
}

export async function searchBookmarks(
  userId: string,
  queryEmbedding: number[],
  filters?: { platform?: string; resource?: string; category?: string; collectionId?: string },
  topK = 20
) {
  const index = getIndex();
  const filter: Record<string, any> = { userId: { $eq: userId } };
  if (filters?.platform)    filter.platform    = { $eq: filters.platform };
  if (filters?.resource)    filter.resource    = { $eq: filters.resource };
  if (filters?.category)    filter.category    = { $eq: filters.category };
  if (filters?.collectionId) filter.collectionId = { $eq: filters.collectionId };

  const results = await index.query({ vector: queryEmbedding, topK, filter, includeMetadata: true });
  return results.matches;
}

export async function deleteBookmarkVector(bookmarkId: string) {
  const index = getIndex();
  await index.deleteOne({ id: bookmarkId });
}

export async function deleteUserVectors(userId: string) {
  const index = getIndex();
  await index.deleteMany({ filter: { userId: { $eq: userId } } });
}
