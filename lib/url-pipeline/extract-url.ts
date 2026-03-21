/**
 * Step 1: Extract a URL from whatever the user typed.
 * Returns null if no URL-like string is found.
 */
export function extractUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();

  // Try to find a URL-like pattern anywhere in the string
  const urlPattern = /https?:\/\/[^\s]+|(?:www\.|youtube\.com|youtu\.be|instagram\.com|twitter\.com|x\.com|reddit\.com|redd\.it)[^\s]*/i;
  const match = trimmed.match(urlPattern);
  if (!match) return null;

  let url = match[0];

  // Add protocol if missing
  if (!url.startsWith('http')) url = 'https://' + url;

  // Strip trailing punctuation that was part of surrounding text
  url = url.replace(/[.,!?)]+$/, '');

  try {
    new URL(url); // validate
    return url;
  } catch {
    return null;
  }
}
