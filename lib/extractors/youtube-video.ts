import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookmarkAIResult, parseGeminiJson } from '../gemini-helpers';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractYouTubeVideo(normalisedUrl: string): Promise<BookmarkAIResult> {
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          fileData: {
            mimeType: 'video/*',
            fileUri: normalisedUrl,
          }
        },
        {
          text: `You are analyzing a YouTube video. Return a JSON object with exactly these fields:
- title: string (the video's title)
- summary: string (3-5 sentences covering the main ideas, arguments, or narrative — write it as if explaining to someone who hasn't watched it)
- key_topics: string[] (5-10 key concepts, subjects, or ideas discussed)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string (pick ONE: Tutorial | Essay | Interview | Documentary | Short | Lecture | Review | Vlog | Debate | Other)
- author: string (the YouTube channel name)
- searchable_context: string (a dense paragraph including all specific frameworks, named techniques, people mentioned, book titles, product names, terminology — optimised for semantic search. This is the most important field.)
- thumbnail_url: string | null (always null — set by caller)

Return ONLY valid JSON. No markdown fences, no explanation, no extra keys.`
        }
      ]
    }]
  });

  return parseGeminiJson(result.response.text());
}

/**
 * Fetch YouTube video metadata using oEmbed API (no API key needed).
 */
export async function fetchYouTubeOEmbed(url: string): Promise<{ title: string; author_name: string; thumbnail_url: string }> {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(oEmbedUrl);
  if (!response.ok) throw new Error(`oEmbed failed: ${response.status}`);
  return response.json();
}
