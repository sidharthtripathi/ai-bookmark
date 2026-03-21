import { extractUrl } from './extract-url';
import { resolveRedirects } from './resolve-redirects';
import { classifyUrl } from './classify-url';
import type { ClassifiedUrl } from './classify-url';

export type { ClassifiedUrl };

export async function processRawInput(rawInput: string): Promise<ClassifiedUrl> {
  const extracted = extractUrl(rawInput);
  if (!extracted) return { valid: false, reason: 'no_url_found' };

  const resolved = await resolveRedirects(extracted);
  return classifyUrl(resolved);
}
