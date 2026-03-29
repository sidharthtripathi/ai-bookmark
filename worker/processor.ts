import { db } from '../lib/db';
import { upsertBookmarkVector } from '../lib/pinecone';
import { generateEmbedding } from '../lib/embeddings';
import { uploadThumbnailToStorage } from '../lib/storage';
import { classifyUrl } from '../lib/url-pipeline/classify-url';
import { extractYouTubeVideo } from '../lib/extractors/youtube-video';
import { extractYouTubeChannel } from '../lib/extractors/youtube-channel';
import { extractTwitter } from '../lib/extractors/twitter';
import { extractInstagram } from '../lib/extractors/instagram';
import { extractRedditThread, extractRedditSubreddit, extractRedditUser } from '../lib/extractors/reddit';
import { extractWebPage } from '../lib/extractors/web';
import { downloadBuffer } from '../lib/storage';
import type { AIResult } from '../lib/minimax';

export async function handleProcessingJob(processedContentId: string) {
  const content = await db.processedContent.findUnique({
    where: { id: processedContentId },
    include: { bookmarks: true }
  });
  if (!content) throw new Error(`ProcessedContent ${processedContentId} not found`);

  await db.processedContent.update({
    where: { id: processedContentId },
    data: { status: 'processing' }
  });

  try {
    const aiResult = await routeExtractor(content);

    // Download thumbnail buffer BEFORE uploading to permanent storage
    // (Instagram CDN URLs expire quickly — must download immediately)
    let thumbnailBuffer: Buffer | null = null;
    if (aiResult.thumbnail_url) {
      try {
        thumbnailBuffer = await downloadBuffer(aiResult.thumbnail_url);
      } catch (err) {
        console.warn(`Failed to download thumbnail for embedding: ${aiResult.thumbnail_url}`);
        // Continue without image embedding — text-only embedding will be used
      }
    }

    // Upload thumbnail to permanent R2 storage
    const permanentThumbnailUrl = aiResult.thumbnail_url
      ? await uploadThumbnailToStorage(aiResult.thumbnail_url, processedContentId)
      : null;

    // Generate multimodal embedding (text + image if available)
    // gemini-embedding-2-preview supports text, images, video, audio in one embedding
    const embeddingValues = await generateEmbedding({
      title: aiResult.title,
      summary: aiResult.summary,
      searchableContext: aiResult.searchable_context,
      thumbnailBuffer,
      mimeType: 'image/jpeg',
    });

    await db.processedContent.update({
      where: { id: processedContentId },
      data: {
        title:            aiResult.title,
        summary:          aiResult.summary,
        keyTopics:        aiResult.key_topics,
        category:         aiResult.category,
        contentType:      aiResult.content_type,
        authorHandle:     aiResult.author ?? null,
        thumbnailUrl:     permanentThumbnailUrl,
        searchableContext: aiResult.searchable_context,
        embeddingValues,
        status: 'done',
        processedAt: new Date(),
      }
    });

    await db.bookmark.updateMany({
      where: { processedContentId },
      data: { status: 'done' }
    });

    for (const bookmark of content.bookmarks) {
      await upsertBookmarkVector(
        bookmark.id,
        bookmark.userId,
        content.platform,
        content.resource,
        aiResult.category,
        bookmark.collectionId ?? null,
        embeddingValues
      );
    }

  } catch (error: any) {
    await db.processedContent.update({
      where: { id: processedContentId },
      data: { status: 'failed', errorMessage: error.message }
    });
    await db.bookmark.updateMany({
      where: { processedContentId },
      data: { status: 'failed', errorMessage: error.message }
    });
    throw error;
  }
}

async function routeExtractor(content: { platform: string; resource: string; normalisedUrl: string }): Promise<AIResult> {
  const { platform, resource, normalisedUrl } = content;

  if (platform === 'youtube') {
    if (resource === 'video' || resource === 'short') return extractYouTubeVideo(normalisedUrl);
    if (resource === 'channel') return extractYouTubeChannel(normalisedUrl);
  }
  if (platform === 'twitter') {
    const classified = classifyUrl(normalisedUrl);
    if (!classified.valid || classified.platform !== 'twitter') throw new Error('Re-classification failed');
    return extractTwitter(classified as any);
  }
  if (platform === 'instagram') {
    const classified = classifyUrl(normalisedUrl);
    if (!classified.valid || classified.platform !== 'instagram') throw new Error('Re-classification failed');
    return extractInstagram(classified as any);
  }
  if (platform === 'reddit') {
    if (resource === 'thread') return extractRedditThread(classifyUrl(normalisedUrl) as any);
    if (resource === 'subreddit') return extractRedditSubreddit(classifyUrl(normalisedUrl) as any);
    if (resource === 'user') return extractRedditUser(normalisedUrl);
  }
  return extractWebPage(normalisedUrl);
}
