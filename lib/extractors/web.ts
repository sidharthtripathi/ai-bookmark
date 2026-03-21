import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseGeminiJson } from '../gemini-helpers';
import type { BookmarkAIResult } from '../gemini-helpers';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractWebPage(normalisedUrl: string): Promise<BookmarkAIResult> {
  let thumbnailUrl: string | null = null;

  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze this webpage: ${normalisedUrl}

Return a JSON object with exactly these fields:
- title: string (page or article title)
- summary: string (3-5 sentences covering the main argument, findings, or content)
- key_topics: string[] (5-10 concepts or subjects)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Article" | "Blog Post" | "News" | "Documentation" | "Recipe" | "Research Paper" | "Product Page" | "Tutorial" | "Other")
- author: string | null (author name or publication name if found, else null)
- searchable_context: string (all specific names, methodologies, product names, book references, named frameworks, terminology — optimised for semantic search)
- thumbnail_url: string | null (the Open Graph og:image URL if the page has one, else null)

Return ONLY valid JSON. No markdown fences, no explanation.`
        }]
      }]
    });

    return parseGeminiJson(result.response.text());
  } catch {
    // Fallback: fetch HTML and extract readable content
    const response = await fetch(normalisedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Failed to fetch webpage: ${response.status}`);

    const html = await response.text();

    // Extract og:image for thumbnail
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) thumbnailUrl = ogMatch[1];

    // Use Readability to extract article content
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const pageText = `
Title: ${article?.title ?? 'Unknown'}
Content: ${article?.textContent ?? html.slice(0, 5000)}
    `.trim();

    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze this webpage content and return a JSON object:

---
${pageText}
---

Return a JSON object with exactly these fields:
- title: string (page or article title)
- summary: string (3-5 sentences covering the main argument, findings, or content)
- key_topics: string[] (5-10 concepts or subjects)
- category: string (pick exactly ONE: Technology | Science | Health | Finance | Business | Design | Education | Entertainment | News | Food | Travel | Sports | Philosophy | History | Art | Other)
- content_type: string ("Article" | "Blog Post" | "News" | "Documentation" | "Recipe" | "Research Paper" | "Product Page" | "Tutorial" | "Other")
- author: string | null (author name or publication name if found, else null)
- searchable_context: string (all specific names, methodologies, product names, book references, named frameworks, terminology — optimised for semantic search)
- thumbnail_url: string | null (${thumbnailUrl ? `"${thumbnailUrl}"` : 'null'})

Return ONLY valid JSON.`
        }]
      }]
    });

    const aiResult = parseGeminiJson(result.response.text());
    aiResult.thumbnail_url = aiResult.thumbnail_url ?? thumbnailUrl;
    return aiResult;
  }
}
