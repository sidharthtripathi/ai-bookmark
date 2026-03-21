const SHORT_LINK_DOMAINS = ['t.co', 'bit.ly', 'redd.it', 'ow.ly', 'tinyurl.com'];

/**
 * Step 2: Follow redirects for known shortener domains.
 * Returns the final resolved URL, or the original URL if no redirect needed.
 */
export async function resolveRedirects(url: string): Promise<string> {
  const hostname = new URL(url).hostname.replace('www.', '');
  if (!SHORT_LINK_DOMAINS.includes(hostname)) return url;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    return response.url;
  } catch {
    return url;
  }
}
