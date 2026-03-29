import Anthropic from '@anthropic-ai/sdk';

const minimax = new Anthropic({
  apiKey: process.env.MINIMAX_API_KEY!,
  baseURL: 'https://api.minimax.io/anthropic',
});

export interface AIResult {
  title: string;
  summary: string;
  key_topics: string[];
  category: string;
  content_type: string;
  author: string | null;
  searchable_context: string;
  thumbnail_url: string | null;
}

export async function generateText(prompt: string, systemPrompt: string): Promise<string> {
  const response = await minimax.messages.create({
    model: 'MiniMax-M2.7',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt }
    ],
  });

  // Extract text from response content blocks (skip thinking blocks)
  const textBlocks = response.content.filter(block => block.type === 'text');
  if (textBlocks.length === 0) {
    throw new Error('MiniMax returned no text blocks in response');
  }
  return textBlocks.map(block => (block as any).text ?? '').join('\n');
}

export function parseAIJson(rawText: string): AIResult {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`AI returned invalid JSON: ${rawText.slice(0, 200)}`);
  }
}
