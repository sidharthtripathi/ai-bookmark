import { ApifyClient } from 'apify-client';
import { generateText, parseAIJson } from '../minimax';
import type { ClassifiedUrl } from '../url-pipeline/classify-url';
import type { AIResult } from '../minimax';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });

interface TwitterScrapedData {
  text?: string;
  author?: { userName?: string };
  media?: Array<{ type: string; url: string }>;
  urls?: Array<{ expandedUrl?: string; displayUrl?: string }>;
  quotedTweet?: { text?: string; media?: Array<{ type: string; url: string }>; author?: { userName?: string } };
  inReplyToId?: string;
}

type ValidTwitterUrl = ClassifiedUrl & { platform: 'twitter'; valid: true };

export async function scrapeTwitter(classifiedUrl: ValidTwitterUrl): Promise<TwitterScrapedData[]> {
  const input =
    classifiedUrl.resource === 'tweet'
      ? { startUrls: [{ url: classifiedUrl.normalised }], maxTweets: 50 }
      : { startUrls: [{ url: classifiedUrl.normalised }], maxTweets: 20 };

  const run = await apify.actor('quacker/twitter-scraper').call(input, { timeout: 60000 });
  const { items } = await apify.dataset(run.defaultDatasetId).listItems({});

  if (!items.length) throw new Error('Twitter scraper returned no results — post may be deleted or private');

  return items as TwitterScrapedData[];
}

export async function extractTwitter(classifiedUrl: ValidTwitterUrl): Promise<AIResult> {
  const scraped = await scrapeTwitter(classifiedUrl);

  const isThread = scraped.length > 1 && scraped.every(t => t.author?.userName === scraped[0].author?.userName);
  const contentType = classifiedUrl.resource === 'profile' ? 'Twitter Profile' : (isThread ? 'Thread' : 'Tweet');

  const allMediaItems = scraped.flatMap(t => [
    ...(t.media ?? []),
    ...(t.quotedTweet?.media ?? []),
  ]);
  const photoUrls = allMediaItems
    .filter(m => m.type === 'photo')
    .map(m => m.url)
    .slice(0, 4);

  const hasVideo = allMediaItems.some(m => m.type === 'video');
  const hasGif   = allMediaItems.some(m => m.type === 'gif');

  const tweetBlocks = scraped.map((t, i) => {
    const mediaNote = [
      ...(t.media?.filter(m => m.type === 'video').map(() => '[Video attached]') ?? []),
      ...(t.media?.filter(m => m.type === 'gif').map(() => '[GIF attached]') ?? []),
    ].join(' ');
    const urlNote = t.urls?.map((u: any) => `[Link: ${u.displayUrl}]`).join(' ') ?? '';
    const quotedNote = t.quotedTweet
      ? `[Quoted tweet from @${t.quotedTweet.author?.userName}: "${t.quotedTweet.text?.slice(0, 200)}"]`
      : '';

    return `[${i === 0 ? 'Main tweet' : `Reply ${i}`}] @${t.author?.userName}: ${t.text}${mediaNote ? ' ' + mediaNote : ''}${urlNote ? ' ' + urlNote : ''}${quotedNote ? '\n' + quotedNote : ''}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert Twitter/X content analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const result = await generateText(
    `You are analyzing a Twitter/X ${contentType.toLowerCase()}.
${photoUrls.length > 0 ? `Note: this tweet/thread contains ${photoUrls.length} image(s) (URLs: ${photoUrls.join(', ')}).` : ''}
${hasVideo ? 'Note: this tweet also contains a video (not analyzed — describe based on text context).' : ''}
${hasGif ? 'Note: this tweet also contains a GIF.' : ''}

Tweet content:
---
${tweetBlocks}
---

Analyze ALL content above — text, any quoted tweets, and linked URLs. Return a JSON object with exactly these fields:
- title: string (first ~100 characters of the main tweet text, or display name for profiles)
- summary: string (2-4 sentences covering what is said, shown, or argued across the whole tweet/thread)
- key_topics: string[] (5-10 topics, hashtags, concepts mentioned)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Tweet" | "Tweet with Images" | "Tweet with Video" | "Thread" | "Thread with Media" | "Twitter Profile")
- author: string (@username of the main author)
- searchable_context: string (all specific names, arguments, linked resources, hashtags, people referenced — optimised for semantic search)
- thumbnail_url: string | null (always null here — set by caller)

Return ONLY valid JSON. No markdown fences, no explanation.`,
    systemPrompt
  );

  const aiResult = parseAIJson(result);
  aiResult.thumbnail_url = photoUrls[0] ?? null;

  return aiResult;
}
