import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';

function cuidToUuid(cuid: string): string {
  // Create a deterministic UUID from a CUID
  const hash = crypto.createHash('sha256').update(cuid).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'bookmarks';
const VECTOR_DIMENSION = 3072;

// Singleton client
let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    const host = process.env.QDRANT_HOST || 'localhost';
    const port = parseInt(process.env.QDRANT_PORT || '6333', 10);
    const apiKey = process.env.QDRANT_API_KEY;

    client = new QdrantClient({
      host,
      port,
      apiKey,
    });
  }
  return client;
}

// Ensure collection exists with proper configuration
export async function ensureCollection(): Promise<void> {
  const qdrant = getClient();
  try {
    const coll = await qdrant.getCollection(COLLECTION_NAME);
  } catch {
    // Collection doesn't exist, create it
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_DIMENSION,
        distance: 'Cosine',
      },
    });
  }
}

export async function upsertBookmarkVector(
  bookmarkId: string,
  userId: string,
  platform: string,
  resource: string,
  category: string,
  collectionId: string | null,
  embedding: number[]
): Promise<void> {
  const qdrant = getClient();
  await ensureCollection();

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: cuidToUuid(bookmarkId),
        vector: embedding,
        payload: {
          bookmarkId,
          userId,
          platform,
          resource,
          category,
          collectionId: collectionId ?? '',
        },
      },
    ],
  });
}

export interface SearchFilters {
  platform?: string;
  resource?: string;
  category?: string;
  collectionId?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  userId: string;
  platform: string;
  resource: string;
  category: string;
  collectionId: string;
}

export async function searchBookmarks(
  userId: string,
  queryEmbedding: number[],
  filters?: SearchFilters,
  topK = 20
): Promise<SearchResult[]> {
  const qdrant = getClient();
  await ensureCollection();

  // Build filter conditions
  const mustConditions: any[] = [
    { key: 'userId', match: { value: userId } },
  ];

  if (filters?.platform) {
    mustConditions.push({ key: 'platform', match: { value: filters.platform } });
  }
  if (filters?.resource) {
    mustConditions.push({ key: 'resource', match: { value: filters.resource } });
  }
  if (filters?.category) {
    mustConditions.push({ key: 'category', match: { value: filters.category } });
  }
  if (filters?.collectionId) {
    mustConditions.push({ key: 'collectionId', match: { value: filters.collectionId } });
  }

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
    filter: {
      must: mustConditions,
    },
    score_threshold: 0.7, // Only return results with cosine similarity > 0.7
  });

  return results.map((point: any) => ({
    id: point.payload.bookmarkId,
    score: point.score,
    userId: point.payload.userId,
    platform: point.payload.platform,
    resource: point.payload.resource,
    category: point.payload.category,
    collectionId: point.payload.collectionId,
  }));
}

export async function deleteBookmarkVector(bookmarkId: string): Promise<void> {
  const qdrant = getClient();
  await qdrant.delete(COLLECTION_NAME, {
    points: [cuidToUuid(bookmarkId)],
  });
}

export async function deleteUserVectors(userId: string): Promise<void> {
  const qdrant = getClient();
  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [{ key: 'userId', match: { value: userId } }],
    },
  });
}
