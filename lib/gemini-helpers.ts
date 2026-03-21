export interface BookmarkAIResult {
  title: string;
  summary: string;
  key_topics: string[];
  category: string;
  content_type: string;
  author: string | null;
  searchable_context: string;
  thumbnail_url: string | null;
}

export function parseGeminiJson(rawText: string): BookmarkAIResult {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`);
  }
}
