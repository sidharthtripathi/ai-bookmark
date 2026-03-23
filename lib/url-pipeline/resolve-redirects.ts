import { validateUrlForFetching } from '../url-validator';

const SHORT_LINK_DOMAINS = ['t.co', 'bit.ly', 'redd.it', 'ow.ly', 'tinyurl.com'];

/**
 * Step 2: Follow redirects for known shortener domains.
 * Returns the final resolved URL, or the original URL if no redirect needed.
 * The final resolved URL is validated against SSRF protection.
 */
export async function resolveRedirects(url: string): Promise<string> {
  const hostname = new URL(url).hostname.replace('www.', '');
  if (!SHORT_LINK_DOMAINS.includes(hostname)) return url;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual', // Don't auto-follow — we need to validate each step
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });

    // Follow redirects manually, validating each destination
    let currentUrl = url;
    let followCount = 0;
    const maxRedirects = 10;

    while (followCount < maxRedirects) {
      const location = response.headers.get('location');
      if (!location) break;

      // Handle relative redirects
      const redirectUrl = new URL(location, currentUrl).toString();

      // Validate the redirect target
      const validation = validateUrlForFetching(redirectUrl);
      if (!validation.valid) {
        console.warn(`Redirect blocked by SSRF protection: ${redirectUrl} (${validation.reason})`);
        return currentUrl; // Return the last safe URL
      }

      currentUrl = redirectUrl;

      // Fetch the redirect target
      const nextResponse = await fetch(redirectUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
        signal: AbortSignal.timeout(5000),
      });

      if (nextResponse.status < 300 || nextResponse.status >= 400) {
        // Not a redirect, we're done
        return currentUrl;
      }

      followCount++;
    }

    return currentUrl;
  } catch {
    return url;
  }
}
