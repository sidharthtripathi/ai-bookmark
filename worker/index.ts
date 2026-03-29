import 'dotenv/config';
import { Worker } from 'bullmq';
import { handleProcessingJob } from './processor';
import { handlePineconeUpsertJob } from './pinecone-worker';

function getRedisConnection() {
  const url = process.env.REDIS_URL!;
  // Support both redis:// URLs and rediss:// (TLS) URLs
  // Also support password in URL: redis://:password@host:port
  return { url };
}

const worker = new Worker('content-processing', async (job) => {
  if (job.name === 'process') return handleProcessingJob(job.data.processedContentId);
  if (job.name === 'pinecone-upsert') return handlePineconeUpsertJob(job.data.bookmarkId, job.data.processedContentId);
}, { connection: getRedisConnection(), concurrency: 3 });

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed after all retries:`, err.message);
});

console.log('Worker started — listening for content-processing jobs');
