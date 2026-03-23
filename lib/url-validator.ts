/**
 * URL Security Validation Utilities
 *
 * Provides SSRF protection by validating URLs against:
 * - Blocked schemes (javascript:, data:, file:, etc.)
 * - Blocked hostnames (localhost, internal DNS, etc.)
 * - Private/reserved IP ranges (IPv4 and IPv6)
 */

const BLOCKED_SCHEMES = ['javascript:', 'data:', 'file:', 'ftp:', 'jar:', 'mailto:', 'dict:', 'tel:', 'vbscript:'];

const BLOCKED_HOSTNAME_PREFIXES = [
  'localhost',
  '127.',
  '0.',
  '10.',
  '172.1', '172.2', '172.3', '172.4', '172.5', '172.6', '172.7', '172.8', '172.9',
  '172.10', '172.11', '172.12', '172.13', '172.14', '172.15', '172.16', '172.17',
  '172.18', '172.19', '172.20', '172.21', '172.22', '172.23', '172.24', '172.25',
  '172.26', '172.27', '172.28', '172.29', '172.30', '172.31', '172.32',
  '192.168',
  '169.254', // AWS metadata
  'metadata.google.internal',
  'metadata',
  // IPv6 loopback and unique local
  '::1',
  'fc00:', 'fd00:',
  'fe80:',
  // Apple Bonjour
  'local.',
  // Docker/Kubernetes internal
  'bridge.internal',
  'host.internal',
];

/**
 * Validates that a URL is safe to fetch (not an SSRF risk).
 * Returns { valid: true } if safe, { valid: false, reason: string } if blocked.
 */
export function validateUrlForFetching(url: string): { valid: true; url: string } | { valid: false; reason: string } {
  // First, check if it's a valid URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'invalid_url' };
  }

  // Check scheme — only http and https allowed
  const scheme = parsed.protocol.toLowerCase();
  if (scheme !== 'http:' && scheme !== 'https:') {
    return { valid: false, reason: `blocked_scheme:${scheme}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames (starts-with matching)
  for (const blocked of BLOCKED_HOSTNAME_PREFIXES) {
    if (hostname === blocked || hostname.startsWith(blocked + '.')) {
      return { valid: false, reason: `blocked_hostname:${hostname}` };
    }
  }

  // Resolve hostname to IP and check for private ranges
  try {
    const ips = dnsResolveSync(hostname);
    if (ips) {
      for (const ip of ips) {
        if (isPrivateIP(ip)) {
          return { valid: false, reason: `private_ip:${ip}` };
        }
      }
    }
  } catch {
    // DNS resolution failed — let the fetch proceed and fail naturally
    // (don't block legitimate URLs due to DNS issues)
  }

  return { valid: true, url: parsed.toString() };
}

/**
 * Check if an IP address is in a private/reserved range.
 * Supports both IPv4 and IPv6.
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 checks
  if (ip.includes('.')) {
    // localhost
    if (ip === '127.0.0.1') return true;

    // 10.x.x.x
    if (ip.startsWith('10.')) return true;

    // 172.16.x.x - 172.31.x.x
    if (ip.startsWith('172.')) {
      const octet = parseInt(ip.split('.')[1], 10);
      if (octet >= 16 && octet <= 31) return true;
    }

    // 192.168.x.x
    if (ip.startsWith('192.168.')) return true;

    // 169.254.x.x (link-local)
    if (ip.startsWith('169.254.')) return true;

    // 0.x.x.x
    if (ip.startsWith('0.')) return true;

    // Loopback 127.x.x.x (already checked above, but catch all)
    if (ip.startsWith('127.')) return true;

    // RFC 1918 — already covered but explicit
    // 100.64.x.x - 100.127.x.x (Carrier-grade NAT)
    if (ip.startsWith('100.')) {
      const second = parseInt(ip.split('.')[1], 10);
      if (second >= 64 && second <= 127) return true;
    }

    return false;
  }

  // IPv6 checks
  if (ip.includes(':')) {
    // Loopback ::1
    if (ip === '::1') return true;

    // fe80::/10 (link-local)
    if (ip.startsWith('fe80:')) return true;

    // fc00::/7 (unique local addresses)
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true;

    // ::ffff:x.x.x.x (IPv4-mapped IPv6)
    if (ip.startsWith('::ffff:')) return true;

    return false;
  }

  return false;
}

/**
 * Synchronous DNS lookup using Node's built-in dns module.
 * Returns array of IP addresses or null if resolution fails.
 */
function dnsResolveSync(hostname: string): string[] | null {
  const dns = require('dns');
  try {
    // Use lookupSync for synchronous resolution
    const result = dns.lookupSync(hostname, { all: true });
    if (Array.isArray(result)) {
      return result.map(r => r.address);
    }
    return [result.address];
  } catch {
    return null;
  }
}

/**
 * Validate a URL and throw if invalid.
 * Use this when you want to fail fast rather than handle a result object.
 */
export function assertUrlSafe(url: string): string {
  const result = validateUrlForFetching(url);
  if (!result.valid) {
    throw new Error(`URL blocked due to SSRF protection: ${result.reason}`);
  }
  return result.url;
}
