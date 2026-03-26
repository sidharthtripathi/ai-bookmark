import { ApifyClient } from 'apify-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { parseGeminiJson } from '../gemini-helpers';
import type { ClassifiedUrl } from '../url-pipeline/classify-url';
import type { BookmarkAIResult } from '../gemini-helpers';
import { downloadBuffer } from '../storage';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface InstagramPost {
  type?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  images?: string[];
  mediaTypes?: string[];
  caption?: string;
  ownerUsername?: string;
  shortCode?: string;
}

export async function extractInstagram(classifiedUrl: ClassifiedUrl & { platform: 'instagram' }): Promise<BookmarkAIResult> {
  if (!classifiedUrl.valid) throw new Error('Invalid URL');
  if (classifiedUrl.resource === 'profile') return extractInstagramProfile(classifiedUrl as any);
  return extractInstagramPost(classifiedUrl as any);
}

async function extractInstagramPost(
  classifiedUrl: ClassifiedUrl & { platform: 'instagram'; resource: 'post' | 'reel'; valid: true }
): Promise<BookmarkAIResult> {
  const run = await apify.actor('apify/instagram-post-scraper').call({
    directUrls: [classifiedUrl.normalised],
    resultsLimit: 1,
  }, { timeout: 30000 });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems({});
  if (!items.length) throw new Error('Instagram post not found');

  const post = items[0] as InstagramPost;
  const caption = post.caption ?? '';
  const author = post.ownerUsername ?? 'unknown';

  if (classifiedUrl.resource === 'reel' || post.type === 'Video') {
    return analyzeInstagramVideo(post, caption, author);
  }
  if (post.type === 'Sidecar') {
    return analyzeInstagramCarousel(post, caption, author);
  }
  return analyzeInstagramImage(post, caption, author);
}

async function analyzeInstagramImage(post: InstagramPost, caption: string, author: string): Promise<BookmarkAIResult> {
  const imageBuffer = await downloadBuffer(post.imageUrl!);

  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } },
        { text: `This is a single-image Instagram post.
Caption: "${caption}"

Analyze the image and caption together. Return a JSON object with exactly these fields:
- title: string (short descriptive title based on image and caption, max 100 chars)
- summary: string (2-4 sentences — what is shown, what the post is about)
- key_topics: string[] (5-10 topics, themes, objects, or subjects visible or mentioned)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Photo" | "Infographic" | "Meme" | "Screenshot" | "Illustration" | "Recipe" | "Other")
- author: string ("${author}")
- searchable_context: string (all objects, places, people, brands, text visible in image, key themes from caption — optimised for semantic search)
- thumbnail_url: string | null (always null — set by caller)

Return ONLY valid JSON.` }
      ]
    }]
  });

  const aiResult = parseGeminiJson(result.response.text());
  aiResult.thumbnail_url = post.imageUrl ?? null;
  return aiResult;
}

async function analyzeInstagramCarousel(post: InstagramPost, caption: string, author: string): Promise<BookmarkAIResult> {
  const carouselImages = (post.images ?? [])
    .filter((url: string) => url)
    .slice(0, 4);

  const imageBuffers = await Promise.all(carouselImages.map(downloadBuffer));

  const parts: any[] = imageBuffers.map(buf => ({
    inlineData: { mimeType: 'image/jpeg', data: buf.toString('base64') }
  }));

  parts.push({
    text: `This is an Instagram carousel post with ${post.images?.length ?? 'multiple'} items total.
${carouselImages.length} image(s) are shown above.
Caption: "${caption}"

Analyze ALL images shown and the caption together. Return a JSON object with exactly these fields:
- title: string (short descriptive title capturing the carousel's theme, max 100 chars)
- summary: string (2-4 sentences — what the carousel is about, what the images collectively show)
- key_topics: string[] (5-10 topics, themes, objects, or subjects across all images and caption)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Carousel" | "Photo Series" | "Tutorial Series" | "Before/After" | "Other")
- author: string ("${author}")
- searchable_context: string (all objects, places, people, brands, text visible across images, themes from caption — optimised for semantic search)
- thumbnail_url: string | null (always null — set by caller)

Return ONLY valid JSON.`
  });

  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({ contents: [{ role: 'user', parts }] });

  const aiResult = parseGeminiJson(result.response.text());
  aiResult.thumbnail_url = carouselImages[0] ?? post.imageUrl ?? null;
  return aiResult;
}

async function analyzeInstagramVideo(post: InstagramPost, caption: string, author: string): Promise<BookmarkAIResult> {
  const videoBuffer = await downloadBuffer(post.videoUrl!);
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

  const uploadResult = await fileManager.uploadFile(videoBuffer, {
    mimeType: 'video/mp4',
    displayName: `instagram-${post.shortCode}-${Date.now()}`,
  });

  let file = await fileManager.getFile(uploadResult.file.name);
  let attempts = 0;
  while (file.state === FileState.PROCESSING && attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    file = await fileManager.getFile(uploadResult.file.name);
    attempts++;
  }
  if (file.state !== FileState.ACTIVE) throw new Error('Gemini file processing failed or timed out');

  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { fileData: { mimeType: 'video/mp4', fileUri: file.uri } },
        { text: `This is an Instagram ${post.type === 'Video' ? 'video' : 'reel'}.
Caption: "${caption}"

Analyze the full video content and caption together. Return a JSON object with exactly these fields:
- title: string (short descriptive title, max 100 chars)
- summary: string (2-4 sentences — what is shown and what the reel/video is about)
- key_topics: string[] (5-10 topics, themes, or subjects)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Reel" | "Video" | "Tutorial" | "Vlog" | "Comedy" | "Recipe" | "Workout" | "Other")
- author: string ("${author}")
- searchable_context: string (activities shown, places, people, brands, audio/music referenced, techniques demonstrated, key spoken points — optimised for semantic search)
- thumbnail_url: string | null (always null — set by caller)

Return ONLY valid JSON.` }
      ]
    }]
  });

  await fileManager.deleteFile(file.name);

  const aiResult = parseGeminiJson(result.response.text());
  aiResult.thumbnail_url = post.thumbnailUrl ?? post.imageUrl ?? null;
  return aiResult;
}

async function extractInstagramProfile(classifiedUrl: ClassifiedUrl & { platform: 'instagram'; resource: 'profile'; valid: true }): Promise<BookmarkAIResult> {
  const run = await apify.actor('apify/instagram-profile-scraper').call({
    directUrls: [classifiedUrl.normalised],
    resultsLimit: 1,
  }, { timeout: 30000 });
  const { items } = await apify.dataset(run.defaultDatasetId).listItems({});
  if (!items.length) throw new Error('Instagram profile not found');

  const profile = items[0] as any;
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{
        text: `Analyze this Instagram profile:
Username: ${profile.username}
Full name: ${profile.fullName ?? ''}
Bio: ${profile.description ?? ''}
Following: ${profile.followingCount ?? ''}
Followers: ${profile.followersCount ?? ''}
Posts: ${profile.postsCount ?? ''}

Return a JSON object with exactly these fields:
- title: string (profile display name or username)
- summary: string (2-3 sentences about this profile, what they post about, who they are)
- key_topics: string[] (5-10 topics this profile covers)
- category: string (pick ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Instagram Profile")
- author: string (username)
- searchable_context: string (profile niche, content themes, audience type — optimised for semantic search)
- thumbnail_url: string | null (profile picture URL if available)

Return ONLY valid JSON. No markdown fences.`
      }]
    }]
  });

  const aiResult = parseGeminiJson(result.response.text());
  aiResult.thumbnail_url = profile.profilePicture ?? null;
  return aiResult;
}
