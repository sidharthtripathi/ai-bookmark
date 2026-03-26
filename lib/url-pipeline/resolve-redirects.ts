import { validateUrlForFetching } from '../url-validator';

/**
 * Step 2: Follow redirects for any HTTP URL.
 * Returns the final resolved URL, or the original URL if no redirect is needed.
 * Each redirect target is validated against SSRF protection.
 */
export async function resolveRedirects(url: string): Promise<string> {
  // Only attempt redirects for http/https URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual', // Don't auto-follow — we need to validate each step
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });

    // If not a redirect, return as-is
    if (response.status < 300 || response.status >= 400) {
      return url;
    }

    // Follow redirects manually, validating each destination
    let currentUrl = url;
    let followCount = 0;
    const maxRedirects = 10;

    while (followCount < maxRedirects) {
      const location = response.headers.get('location');
      if (!location) break;

      // Handle relative redirects
      let redirectUrl: string;
      try {
        redirectUrl = new URL(location, currentUrl).toString();
      } catch {
        // Invalid redirect URL, stop here
        return currentUrl;
      }

      // Validate the redirect target against SSRF protection
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

      // 200-299 is success, 300-399 is redirect, anything else means we're done
      if (nextResponse.status < 300 || nextResponse.status >= 400) {
        // Not a redirect (or error), we're done
        return currentUrl;
      }

      followCount++;
    }

    return currentUrl;
  } catch {
    // On error (network issue, timeout, etc.), return original URL
    // The fetch will fail naturally when the worker tries to process it
    return url;
  }
}
