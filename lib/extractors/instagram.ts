import { ApifyClient } from 'apify-client';
import { generateText, parseAIJson } from '../minimax';
import type { ClassifiedUrl } from '../url-pipeline/classify-url';
import type { AIResult } from '../minimax';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });

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

export async function extractInstagram(classifiedUrl: ClassifiedUrl & { platform: 'instagram' }): Promise<AIResult> {
  if (!classifiedUrl.valid) throw new Error('Invalid URL');
  if (classifiedUrl.resource === 'profile') return extractInstagramProfile(classifiedUrl as any);
  return extractInstagramPost(classifiedUrl as any);
}

async function extractInstagramPost(
  classifiedUrl: ClassifiedUrl & { platform: 'instagram'; resource: 'post' | 'reel'; valid: true }
): Promise<AIResult> {
  const run = await apify.actor('apify/instagram-post-scraper').call({
    directUrls: [classifiedUrl.normalised],
    resultsLimit: 1,
  }, { timeout: 30000 });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems({});
  if (!items.length) throw new Error('Instagram post not found');

  const post = items[0] as InstagramPost;
  const caption = post.caption ?? '';
  const author = post.ownerUsername ?? 'unknown';

  return analyzeInstagramText(post, caption, author);
}

async function analyzeInstagramText(post: InstagramPost, caption: string, author: string): Promise<AIResult> {
  const systemPrompt = `You are an expert Instagram content analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const mediaDescription = [
    post.type ? `Post type: ${post.type}` : '',
    post.images?.length ? `Contains ${post.images.length} image(s)` : '',
    post.videoUrl ? 'Contains a video' : '',
  ].filter(Boolean).join('. ');

  const result = await generateText(
    `Analyze this Instagram post:
Type: ${post.type ?? 'Unknown'}
Author: @${author}
Caption: "${caption}"
${mediaDescription}
Image URLs: ${post.images?.join(', ') ?? post.imageUrl ?? 'None'}

Return a JSON object with exactly these fields:
- title: string (short descriptive title based on caption, max 100 chars)
- summary: string (2-4 sentences — what is shown, what the post is about)
- key_topics: string[] (5-10 topics, themes, or subjects)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Photo" | "Infographic" | "Meme" | "Screenshot" | "Illustration" | "Recipe" | "Carousel" | "Reel" | "Video" | "Other")
- author: string ("${author}")
- searchable_context: string (all themes, places, people, brands, text from caption, key topics — optimised for semantic search)
- thumbnail_url: string | null (post image URL: "${post.imageUrl ?? post.images?.[0] ?? null}")

Return ONLY valid JSON.`,
    systemPrompt
  );

  const aiResult = parseAIJson(result);
  aiResult.thumbnail_url = post.imageUrl ?? post.images?.[0] ?? null;
  return aiResult;
}

async function extractInstagramProfile(classifiedUrl: ClassifiedUrl & { platform: 'instagram'; resource: 'profile'; valid: true }): Promise<AIResult> {
  const run = await apify.actor('apify/instagram-profile-scraper').call({
    directUrls: [classifiedUrl.normalised],
    resultsLimit: 1,
  }, { timeout: 30000 });
  const { items } = await apify.dataset(run.defaultDatasetId).listItems({});
  if (!items.length) throw new Error('Instagram profile not found');

  const profile = items[0] as any;

  const systemPrompt = `You are an expert Instagram profile analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const result = await generateText(
    `Analyze this Instagram profile:
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
- thumbnail_url: string | null (profile picture URL if available: "${profile.profilePicture ?? null}")

Return ONLY valid JSON. No markdown fences.`,
    systemPrompt
  );

  const aiResult = parseAIJson(result);
  aiResult.thumbnail_url = profile.profilePicture ?? null;
  return aiResult;
}
