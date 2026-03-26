/**
 * Step 1: Extract a URL from whatever the user typed.
 * Returns null if no URL-like string is found.
 *
 * Strategy: Accept ANY http/https URL, since we handle all URLs via
 * the "web" platform fallback. This prevents falsely rejecting valid URLs
 * from platforms we don't explicitly recognize in the regex pattern.
 */
export function extractUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();

  // Match any http or https URL (with any domain)
  // This is intentionally broad — we classify/reject URLs later in the pipeline
  const urlPattern = /https?:\/\/[^\s"'<>]+/i;
  const match = trimmed.match(urlPattern);
  if (!match) return null;

  let url = match[0];

  // URL is already http/https from the regex — no scheme addition needed

  // Strip trailing punctuation that was part of surrounding text
  // being careful not to strip trailing ) if it might be part of a valid URL
  url = url.replace(/[.,!?]+$/, '');

  try {
    new URL(url); // validate
    return url;
  } catch {
    return null;
  }
}
