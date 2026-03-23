import { Queue } from 'bullmq';

function getRedisConnection() {
  const url = process.env.REDIS_URL!;
  // Support password in URL: redis://:password@host:port
  return { url };
}

export const processingQueue = new Queue('content-processing', getRedisConnection());

export async function enqueueProcessing(processedContentId: string) {
  await processingQueue.add('process', { processedContentId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export async function enqueuePineconeUpsert(bookmarkId: string, processedContentId: string) {
  await processingQueue.add('pinecone-upsert', { bookmarkId, processedContentId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}
