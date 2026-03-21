import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface EmbeddingOptions {
  title: string;
  summary: string;
  searchableContext: string;
  thumbnailBuffer?: Buffer | null;
  mimeType?: string;
}

/**
 * Generate an embedding using gemini-embedding-2-preview.
 * If thumbnailBuffer is provided, creates a multimodal embedding (text + image).
 * Otherwise, creates a text-only embedding.
 */
export async function generateEmbedding(options: EmbeddingOptions): Promise<number[]> {
  const { title, summary, searchableContext, thumbnailBuffer, mimeType = 'image/jpeg' } = options;
  const textToEmbed = `${title}. ${summary} ${searchableContext}`;

  const model = genai.getGenerativeModel({ model: 'gemini-embedding-2-preview' });

  const parts: any[] = [
    { text: textToEmbed }
  ];

  // If thumbnail is available, add it for multimodal embedding
  if (thumbnailBuffer) {
    parts.push({
      inlineData: {
        mimeType,
        data: thumbnailBuffer.toString('base64'),
      }
    });
  }

  const result = await model.embedContent({
    content: {
      role: 'user',
      parts,
    },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });

  return result.embedding.values;
}
