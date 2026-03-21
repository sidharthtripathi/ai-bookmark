import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookmarkAIResult, parseGeminiJson } from '../gemini-helpers';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractYouTubeChannel(normalisedUrl: string): Promise<BookmarkAIResult> {
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{
        text: `Analyze this YouTube channel: ${normalisedUrl}

Return a JSON object with exactly these fields:
- title: string (channel name)
- summary: string (3-5 sentences — what content does this channel produce, what topics, who is it for)
- key_topics: string[] (5-10 topics this channel covers)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string (always "YouTube Channel")
- author: string (channel name or creator name)
- searchable_context: string (channel niche, notable series or videos mentioned on the page, creator's background, audience type — optimised for semantic search)
- thumbnail_url: string | null (channel avatar/banner URL if found on the page, else null)

Return ONLY valid JSON. No markdown fences, no explanation.`
      }]
    }]
  });

  return parseGeminiJson(result.response.text());
}
