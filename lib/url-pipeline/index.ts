import { extractUrl } from './extract-url';
import { resolveRedirects } from './resolve-redirects';
import { classifyUrl } from './classify-url';
import { validateUrlForFetching } from '../url-validator';
import type { ClassifiedUrl } from './classify-url';

export type { ClassifiedUrl };

export async function processRawInput(rawInput: string): Promise<ClassifiedUrl> {
  const extracted = extractUrl(rawInput);
  if (!extracted) return { valid: false, reason: 'no_url_found' };

  // Critical: Always validate the extracted URL against SSRF protection
  // before any network request or redirect following
  const ssrfCheck = validateUrlForFetching(extracted);
  if (!ssrfCheck.valid) {
    return { valid: false, reason: 'unsafe_url' };
  }

  const resolved = await resolveRedirects(extracted);
  return classifyUrl(resolved);
}
