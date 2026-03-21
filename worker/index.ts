import { Worker } from 'bullmq';
import { handleProcessingJob } from './processor';
import { handlePineconeUpsertJob } from './pinecone-worker';

const worker = new Worker('content-processing', async (job) => {
  if (job.name === 'process') return handleProcessingJob(job.data.processedContentId);
  if (job.name === 'pinecone-upsert') return handlePineconeUpsertJob(job.data.bookmarkId, job.data.processedContentId);
}, { connection: { url: process.env.REDIS_URL! }, concurrency: 3 });

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed after all retries:`, err.message);
});

console.log('Worker started — listening for content-processing jobs');
