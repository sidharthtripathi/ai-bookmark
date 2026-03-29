import { generateText, parseAIJson } from '../minimax';
import type { AIResult } from '../minimax';

export async function extractYouTubeChannel(normalisedUrl: string): Promise<AIResult> {
  const systemPrompt = `You are an expert YouTube channel analyzer. Return ONLY valid JSON with no markdown fences or explanation.`;

  const result = await generateText(
    `Analyze this YouTube channel: ${normalisedUrl}

Return a JSON object with exactly these fields:
- title: string (channel name)
- summary: string (3-5 sentences — what content does this channel produce, what topics, who is it for)
- key_topics: string[] (5-10 topics this channel covers)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string (always "YouTube Channel")
- author: string (channel name or creator name)
- searchable_context: string (channel niche, notable series or videos mentioned on the page, creator's background, audience type — optimised for semantic search)
- thumbnail_url: string | null (channel avatar/banner URL if found on the page, else null)

Return ONLY valid JSON. No markdown fences, no explanation.`,
    systemPrompt
  );

  return parseAIJson(result);
}
