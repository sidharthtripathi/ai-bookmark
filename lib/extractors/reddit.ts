import { generateText, parseAIJson } from '../minimax';
import type { ClassifiedUrl } from '../url-pipeline/classify-url';
import type { AIResult } from '../minimax';

const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT ?? 'BookmarkApp/1.0 (by /u/bookmarkuser)';

async function fetchRedditJson(normalisedUrl: string): Promise<any> {
  const jsonUrl = normalisedUrl.replace(/\/?$/, '.json') + '?limit=50&raw_json=1';
  const response = await fetch(jsonUrl, {
    headers: {
      'User-Agent': REDDIT_USER_AGENT,
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Reddit JSON fetch failed: ${response.status}`);
  return response.json();
}

export async function extractRedditThread(classifiedUrl: ClassifiedUrl & { platform: 'reddit'; resource: 'thread'; valid: true }): Promise<AIResult> {
  const data = await fetchRedditJson(classifiedUrl.normalised);

  const post = data[0]?.data?.children?.[0]?.data;
  const comments = data[1]?.data?.children?.slice(0, 15)
    .map((c: any) => c.data)
    .filter((c: any) => c.body && c.body !== '[deleted]' && c.body !== '[removed]');

  if (!post) throw new Error('Reddit post not found or removed');

  const threadText = `
Title: ${post.title}
Subreddit: r/${post.subreddit}
Author: u/${post.author}
Post content: ${post.selftext || '[link post — no text body]'}
URL linked: ${post.url !== classifiedUrl.normalised ? post.url : ''}
Score: ${post.score} upvotes | ${post.num_comments} comments

Top comments:
${comments?.map((c: any, i: number) => `[Comment ${i+1}] u/${c.author}: ${c.body.slice(0, 500)}`).join('\n\n') ?? 'No comments'}
  `.trim();

  const systemPrompt = `You are an expert Reddit thread analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const result = await generateText(
    `You are analyzing a Reddit thread. Here is the content:

---
${threadText}
---

Return a JSON object with exactly these fields:
- title: string (the post title)
- summary: string (3-5 sentences covering the main post, its argument or question, and key discussion points from comments)
- key_topics: string[] (5-10 topics, concepts, or subjects discussed)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Reddit Thread" | "AMA" | "Discussion" | "Question" | "Link Share" | "News")
- author: string (u/${post.author})
- searchable_context: string (all specific names, techniques, tools, products, arguments, notable comment perspectives — optimised for semantic search)
- thumbnail_url: string | null (post thumbnail URL if it's an image/link post: "${post.thumbnail && !['self','default','nsfw',''].includes(post.thumbnail) ? post.thumbnail : ''}" — use null if not a valid image URL)

Return ONLY valid JSON.`,
    systemPrompt
  );

  return parseAIJson(result);
}

export async function extractRedditSubreddit(classifiedUrl: ClassifiedUrl & { platform: 'reddit'; resource: 'subreddit'; valid: true }): Promise<AIResult> {
  const aboutData = await fetch(`${classifiedUrl.normalised}/about.json`, {
    headers: { 'User-Agent': REDDIT_USER_AGENT }
  }).then(r => r.json());

  const sub = aboutData?.data;
  if (!sub) throw new Error('Subreddit not found or banned');

  const subText = `
Subreddit: r/${sub.display_name}
Title: ${sub.title}
Description: ${sub.public_description}
Extended description: ${sub.description?.slice(0, 1000)}
Members: ${sub.subscribers?.toLocaleString()}
  `.trim();

  const systemPrompt = `You are an expert Reddit subreddit analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const result = await generateText(
    `Analyze this Reddit subreddit and return a JSON object:

---
${subText}
---

Fields:
- title: "r/${sub.display_name}"
- summary: 3-5 sentences about what this subreddit is, what gets posted, who it's for
- key_topics: string[] (5-10 topics)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: "Subreddit"
- author: "r/${sub.display_name}"
- searchable_context: dense paragraph with community focus, typical post types, related communities
- thumbnail_url: "${sub.icon_img || sub.community_icon || null}"

Return ONLY valid JSON.`,
    systemPrompt
  );

  return parseAIJson(result);
}

export async function extractRedditUser(normalisedUrl: string): Promise<AIResult> {
  // Extract username from URL like /u/username
  const match = normalisedUrl.match(/\/u\/([^/]+)/);
  const username = match?.[1] ?? 'unknown';

  const profileData = await fetch(`${normalisedUrl}/about.json`, {
    headers: { 'User-Agent': REDDIT_USER_AGENT }
  }).then(r => r.json()).catch(() => null);

  const user = profileData?.data;

  const systemPrompt = `You are an expert Reddit user analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const result = await generateText(
    `Analyze this Reddit user profile:
Username: u/${username}
Karma: ${user?.karma ?? 'unknown'}
Cake day: ${user?.created_utc ? new Date(user.created_utc * 1000).toLocaleDateString() : 'unknown'}
Has_verified_email: ${user?.has_verified_email ?? false}
${user?.subreddit ? `Subreddit: r/${user.subreddit.display_name}, title: ${user.subreddit.title}, description: ${user.subreddit.public_description}` : ''}

Return a JSON object:
- title: "u/${username}"
- summary: 2-3 sentences about this Reddit user
- key_topics: string[] (5-10 topics based on their activity)
- category: string (pick ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: "Reddit User"
- author: "u/${username}"
- searchable_context: user's typical activity, interests inferred from karma and subreddit
- thumbnail_url: "${user?.subreddit?.icon_img ?? null}"

Return ONLY valid JSON.`,
    systemPrompt
  );

  return parseAIJson(result);
}
